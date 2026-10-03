import {
    startECGSerialReceiver,
    stopECGSerialReceiver,
    getECGSerialStatus,
} from './serialECGReceiver.js';

import {
    buildConsecutiveFeatureSequence,
} from './featureSequenceBuilder.js';

import {
    extractECGFeatureRow,
} from './ecgFeaturePipeline.js';

import {
    predict,
} from '../mlService.js';

import { ECGSignalBuffer } from './ecgSignalBuffer.js';

import { preprocessECG } from './signalFilter.js';

import ECGRecording from '../../models/ECGRecording.js';
import Analysis from '../../models/Analysis.js';

const SAMPLING_RATE = Number(
    process.env.ECG_SAMPLING_RATE || 250,
);

const WINDOW_SECONDS = 10;

let signalBuffer = null;
let currentUser = null;
let lastWindow = null;
let lastResult = null;
let processing = false;

let windowIndex = 0;
let featureRows = [];

function createBuffer() {
    signalBuffer = new ECGSignalBuffer({
        samplingRate: SAMPLING_RATE,
        windowSeconds: WINDOW_SECONDS,
        displaySamples: 500,

        onWindow: async (samples) => {
            await processECGWindow(samples);
        },
    });

    return signalBuffer;
}

async function processECGWindow(samples) {
    if (processing || !currentUser) {
        return;
    }

    processing = true;

    try {
        const filteredSamples = preprocessECG(
            samples,
            SAMPLING_RATE,
        );

        lastWindow = {
            sampleCount: filteredSamples.length,
            samplingRate: SAMPLING_RATE,
            receivedAt: new Date().toISOString(),
        };

        console.log(
            `ECG window received: ${filteredSamples.length} samples`,
        );

        /*
         * Extract 26 features from this single
         * 10-second ECG window.
         */
        const currentWindowIndex = windowIndex;

        const featureResult =
            extractECGFeatureRow({
                samples: filteredSamples,
                samplingRate: SAMPLING_RATE,
                age: currentUser.age,
                isMale: currentUser.isMale,
                windowIndex: currentWindowIndex,
            });

        if (!featureResult.ready) {
            console.log(
                `ECG feature extraction pending: ${featureResult.reason}`,
            );

            lastResult = {
                ready: false,
                reason: featureResult.reason,
            };

            return;
        }

        /*
         * The current window has successfully
         * produced one 26-feature row.
         */
        featureRows.push({
            windowIndex: currentWindowIndex,
            features: featureResult.features,
        });

        windowIndex += 1;

        /*
         * Keep only the latest 10 feature rows.
         */
        if (featureRows.length > 10) {
            featureRows =
                featureRows.slice(-10);
        }

        console.log(
            `Feature rows accumulated: ${featureRows.length}/10`,
        );

        /*
         * We need exactly 10 consecutive
         * feature rows before ML analysis.
         */
        if (featureRows.length < 10) {
            lastResult = {
                ready: false,
                reason:
                    `Waiting for 10 complete ECG windows. ${featureRows.length}/10 available.`,
            };

            return;
        }

        /*
         * Validate the exact 10 × 26 sequence.
         */
        const sequenceResult =
            buildConsecutiveFeatureSequence(
                featureRows,
            );

        if (!sequenceResult.ready) {
            lastResult = {
                ready: false,
                reason: sequenceResult.reason,
            };

            return;
        }

        console.log(
            `ECG features ready: ${sequenceResult.sequenceLength} × ${sequenceResult.featureCount}`,
        );

        /*
         * Send the real 10 × 26 sequence
         * to the Python ML service.
         */
        const analysis = await predict(
            sequenceResult.sequence,
        );

        /*
         * Save the ECG recording.
         */
        const recording =
            await ECGRecording.create({
                userId: currentUser.userId,
                recordedAt: new Date(),
                samples: filteredSamples,
                featureSequence:
                    sequenceResult.sequence,
                samplingRate: SAMPLING_RATE,
                duration:
                    filteredSamples.length /
                    SAMPLING_RATE,
                source: 'ESP32',
                signalQuality: 'UNASSESSED',
            });

        /*
         * Save the ML analysis.
         */
        const savedAnalysis =
            await Analysis.create({
                userId: currentUser.userId,
                recordingId:
                    recording._id.toString(),
                analyzedAt: new Date(),

                features: {
                    featureNames:
                        sequenceResult.featureNames,
                    sequenceLength:
                        sequenceResult.sequenceLength,
                    featureCount:
                        sequenceResult.featureCount,
                },

                prediction: {
                    score: analysis.score,
                    class: analysis.class,
                },

                predictionReason: null,
                probability: null,
                target: null,
                source: 'ESP32',
                status: 'ANALYZED',
            });

        /*
         * Expose the actual 10 × 26 sequence
         * to the frontend.
         */
        lastResult = {
            ready: true,

            recordingId:
                recording._id.toString(),

            analysisId:
                savedAnalysis._id.toString(),

            sequenceLength:
                sequenceResult.sequenceLength,

            featureCount:
                sequenceResult.featureCount,

            featureNames:
                sequenceResult.featureNames,

            sequence:
                sequenceResult.sequence,

            analysis,
        };

        console.log(
            'ECG ML analysis completed and saved.',
        );

        /*
         * Keep the latest 10 windows so that
         * the next window creates a rolling sequence.
         */
        featureRows =
            featureRows.slice(-10);
    } catch (error) {
        console.error(
            'ECG window processing error:',
            error.message,
        );

        lastResult = {
            ready: false,
            reason:
                error.message ||
                'ECG processing failed.',
        };
    } finally {
        processing = false;
    }
}

export function startLiveECG(user) {
    console.log('START LIVE ECG CALLED');

    if (!user) {
        throw new Error(
            'Authenticated user is required.',
        );
    }

    if (signalBuffer) {
        console.log(
            'ECG monitoring is already running.',
        );

        return getLiveECGStatus();
    }

    /*
     * Start a fresh feature sequence
     * for every monitoring session.
     */
    windowIndex = 0;
    featureRows = [];

    currentUser = {
        userId: user.userId,
        age: user.age,
        isMale:
    String(user.gender).toLowerCase() === 'male'
        ? 1
        : 0,
    };

    console.log(
        `ECG monitoring started for user: ${currentUser.userId}`,
    );

    createBuffer();

    console.log(
        'STARTING ECG SERIAL RECEIVER',
    );

    startECGSerialReceiver({
        onSample: (sample) => {
            signalBuffer?.addSample(sample);
        },
    });

    return getLiveECGStatus();
}

export function stopLiveECG() {
    console.log('STOPPING LIVE ECG');

    stopECGSerialReceiver();

    signalBuffer?.clear();

    signalBuffer = null;
    currentUser = null;
    lastWindow = null;
    lastResult = null;
    processing = false;

    /*
     * Clear the accumulated feature sequence
     * when monitoring stops.
     */
    windowIndex = 0;
    featureRows = [];
}

export function getLiveECGStatus() {
    return {
        monitoring:
            signalBuffer !== null,

        userId:
            currentUser?.userId || null,

        samplingRate:
            SAMPLING_RATE,

        windowSeconds:
            WINDOW_SECONDS,

        windowSize:
            SAMPLING_RATE * WINDOW_SECONDS,

        sampleCount:
            signalBuffer?.getSampleCount() || 0,

        recentSamples:
            signalBuffer?.getRecentSamples() || [],

        serial:
            getECGSerialStatus(),

        lastWindow,
        lastResult,
    };
}