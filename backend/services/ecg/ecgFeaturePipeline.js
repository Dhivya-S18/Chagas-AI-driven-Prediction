import { segmentECG } from "./beatSegmenter.js";
import { extractFeatureRow } from "./featureExtractor.js";
import {
    buildConsecutiveFeatureSequence
} from "./featureSequenceBuilder.js";

const REQUIRED_WINDOWS = 10;
export function extractECGFeatureRow({
    samples,
    samplingRate,
    age,
    isMale,
    windowIndex,
}) {
    const featureResult = extractFeatureRow({
        samples,
        samplingRate,
        age,
        isMale,
    });

    if (!featureResult.ready) {
        return {
            ready: false,
            reason: featureResult.reason,
        };
    }

    return {
        ready: true,
        reason: null,
        windowIndex,
        features: featureResult.features,
        featureNames: featureResult.featureNames,
    };
}
export function buildECGFeatureSequence({
    samples,
    samplingRate,
    age,
    isMale,
    windowSeconds = 10
}) {
    const segmentation = segmentECG(
        samples,
        samplingRate,
        windowSeconds
    );

    if (!segmentation.ready) {
        return {
            ready: false,
            reason: segmentation.reason
        };
    }

    if (
        segmentation.windows.length <
        REQUIRED_WINDOWS
    ) {
        return {
            ready: false,
            reason:
                `At least ${REQUIRED_WINDOWS} complete ECG windows are required`
        };
    }

    /*
     * Use the first 10 complete windows.
     *
     * No padding or duplication is performed.
     */
    const selectedWindows =
        segmentation.windows.slice(
            0,
            REQUIRED_WINDOWS
        );

    const featureRows = [];

    for (const window of selectedWindows) {
        const featureResult =
            extractFeatureRow({
                samples: window.samples,
                samplingRate,
                age,
                isMale
            });

        if (!featureResult.ready) {
            return {
                ready: false,
                reason:
                    `Window ${window.windowIndex}: ${featureResult.reason}`
            };
        }

        featureRows.push({
            windowIndex: window.windowIndex,
            features: featureResult.features
        });
    }

    const sequenceResult =
        buildConsecutiveFeatureSequence(
            featureRows
        );

    if (!sequenceResult.ready) {
        return {
            ready: false,
            reason: sequenceResult.reason
        };
    }

    return {
        ready: true,
        reason: null,
        sequenceLength:
            sequenceResult.sequenceLength,
        featureCount:
            sequenceResult.featureCount,
        featureNames:
            sequenceResult.featureNames,
        sequence:
            sequenceResult.sequence,
        windows: selectedWindows.map(
            (window) => ({
                windowIndex: window.windowIndex,
                startSample: window.startSample,
                endSample: window.endSample
            })
        )
    };
}