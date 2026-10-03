import { detectRPeaks } from "./rPeakDetector.js";
import { extractHRVFeatures } from "./hrvExtractor.js";
import { extractMorphologyFeatures } from "./morphologyExtractor.js";

export const ECG_FEATURES = [
    "PR_interval_mean",
    "PR_interval_std",
    "PR_interval_min",
    "PR_interval_max",

    "QRS_duration_mean",
    "QRS_duration_std",
    "QRS_duration_min",
    "QRS_duration_max",

    "QT_interval_mean",
    "QT_interval_std",
    "QT_interval_min",
    "QT_interval_max",

    "ST_segment_mean",
    "ST_segment_std",
    "ST_segment_min",
    "ST_segment_max",

    "ST_slope_mean",
    "ST_slope_std",
    "ST_slope_min",
    "ST_slope_max",

    "HRV_MeanNN",
    "HRV_SDNN",
    "HRV_RMSSD",
    "HRV_pNN50",

    "age",
    "is_male",
];

function isFiniteNumber(value) {
    return (
        typeof value === "number" &&
        Number.isFinite(value)
    );
}

function validateDemographics(age, isMale) {
    if (
        !isFiniteNumber(age) ||
        age < 0 ||
        age > 120
    ) {
        return {
            valid: false,
            reason:
                "Age must be a finite value between 0 and 120",
        };
    }

    if (isMale !== 0 && isMale !== 1) {
        return {
            valid: false,
            reason:
                "is_male must be 0 or 1",
        };
    }

    return {
        valid: true,
        reason: null,
    };
}

function createFeatureRow(
    morphology,
    hrv,
    age,
    isMale,
) {
    const features = {
        ...morphology,
        ...hrv,
        age,
        is_male: isMale,
    };

    const missingFeatures =
        ECG_FEATURES.filter(
            (feature) =>
                !isFiniteNumber(
                    features[feature],
                ),
        );

    if (missingFeatures.length > 0) {
        return {
            ready: false,
            reason:
                "Some ECG features are unavailable",
            missingFeatures,
        };
    }

    const values =
        ECG_FEATURES.map(
            (feature) =>
                features[feature],
        );

    return {
        ready: true,
        reason: null,
        featureNames: ECG_FEATURES,
        features: values,
    };
}

/**
 * Extract one ML-ready 26-feature row
 * from a single-channel ECG signal.
 */
export function extractFeatureRow({
    samples,
    samplingRate,
    age,
    isMale,
}) {
    const demographicValidation =
        validateDemographics(
            age,
            isMale,
        );

    if (!demographicValidation.valid) {
        return {
            ready: false,
            reason:
                demographicValidation.reason,
        };
    }

    if (
        !Array.isArray(samples) ||
        samples.length === 0
    ) {
        return {
            ready: false,
            reason:
                "ECG samples are required",
        };
    }

    if (
        !isFiniteNumber(samplingRate) ||
        samplingRate <= 0
    ) {
        return {
            ready: false,
            reason:
                "Sampling rate must be positive",
        };
    }

    /*
     * 1. Detect R-peaks.
     *
     * detectRPeaks() returns an array
     * of sample indices.
     */
    const rPeaks = detectRPeaks(
        samples,
        samplingRate,
    );

    if (
        !Array.isArray(rPeaks) ||
        rPeaks.length < 3
    ) {
        return {
            ready: false,
            reason:
                "Insufficient R-peaks detected",
        };
    }

    /*
     * 2. Extract HRV features.
     */
    let hrvFeatures;

    try {
        hrvFeatures =
            extractHRVFeatures(
                rPeaks,
                samplingRate,
            );
    } catch (error) {
        return {
            ready: false,
            reason:
                `HRV unavailable: ${error.message}`,
        };
    }

    /*
     * 3. Extract ECG morphology.
     */
    const morphologyResult =
        extractMorphologyFeatures(
            samples,
            rPeaks,
            samplingRate,
        );

    if (
        !morphologyResult ||
        morphologyResult.ready !== true
    ) {
        return {
            ready: false,
            reason:
                morphologyResult?.reason ??
                "Morphology unavailable",
        };
    }

    /*
     * 4. Combine:
     *
     * 20 morphology
     * + 4 HRV
     * + 2 demographics
     * = 26 features
     */
    return createFeatureRow(
        morphologyResult.features,
        hrvFeatures,
        age,
        isMale,
    );
}