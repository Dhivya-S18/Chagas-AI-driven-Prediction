import {
    buildECGFeatureSequence
} from "../services/ecg/ecgFeaturePipeline.js";

import {
    predict
} from "../services/mlService.js";

export async function extractECGFeatures(req, res) {
    try {
        const {
            samples,
            samplingRate,
            age,
            isMale,
            source
        } = req.body;

        // DEMO ECG must never be sent to the real ML pipeline.
        if (source === "DEMO") {
            return res.status(409).json({
                ready: false,
                reason:
                    "DEMO ECG cannot be used for real ML feature extraction"
            });
        }

        // Build the real 10 x 26 ECG feature sequence.
        const featureResult =
            buildECGFeatureSequence({
                samples,
                samplingRate,
                age,
                isMale
            });

        if (!featureResult.ready) {
            return res.status(422).json({
                ready: false,
                reason: featureResult.reason
            });
        }

        // Send the validated 10 x 26 sequence
        // to the Python ML service.
        const mlResult =
            await predict(
                featureResult.sequence
            );

        return res.status(200).json({
            ready: true,

            sequenceLength:
                featureResult.sequenceLength,

            featureCount:
                featureResult.featureCount,

            featureNames:
                featureResult.featureNames,

            sequence:
                featureResult.sequence,

            windows:
                featureResult.windows,

            analysis: mlResult
        });
    } catch (error) {
        console.error(
            "ECG feature extraction error:",
            error
        );

        const statusCode =
            Number.isInteger(error.statusCode)
                ? error.statusCode
                : 500;

        return res.status(statusCode).json({
            ready: false,
            reason:
                error.message ||
                "ECG feature extraction failed"
        });
    }
}