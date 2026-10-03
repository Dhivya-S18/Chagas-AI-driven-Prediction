import { ECG_FEATURES } from "./featureExtractor.js";

const SEQUENCE_LENGTH = 10;

function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}

function validateFeatureRow(row) {
    if (!Array.isArray(row)) {
        return false;
    }

    if (row.length !== ECG_FEATURES.length) {
        return false;
    }

    return row.every(isFiniteNumber);
}

/**
 * Build an exact 10 x 26 sequence.
 *
 * Rows must already represent consecutive ECG windows.
 * No padding, duplication, interpolation, or fake rows are allowed.
 */
export function buildFeatureSequence(rows) {
    if (!Array.isArray(rows)) {
        return {
            ready: false,
            reason: "Feature rows must be an array"
        };
    }

    if (rows.length !== SEQUENCE_LENGTH) {
        return {
            ready: false,
            reason:
                `Exactly ${SEQUENCE_LENGTH} feature rows are required`
        };
    }

    for (let i = 0; i < rows.length; i += 1) {
        if (!validateFeatureRow(rows[i])) {
            return {
                ready: false,
                reason:
                    `Feature row ${i + 1} must contain exactly ${ECG_FEATURES.length} finite values`
            };
        }
    }

    return {
        ready: true,
        reason: null,
        sequenceLength: SEQUENCE_LENGTH,
        featureCount: ECG_FEATURES.length,
        featureNames: ECG_FEATURES,
        sequence: rows
    };
}

/**
 * Build a sequence only when rows have explicit
 * consecutive source-window indexes.
 */
export function buildConsecutiveFeatureSequence(rows) {
    if (!Array.isArray(rows)) {
        return {
            ready: false,
            reason: "Feature rows must be an array"
        };
    }

    if (rows.length !== SEQUENCE_LENGTH) {
        return {
            ready: false,
            reason:
                `Exactly ${SEQUENCE_LENGTH} feature rows are required`
        };
    }

    for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];

        if (!row || typeof row !== "object") {
            return {
                ready: false,
                reason: `Feature row ${i + 1} is invalid`
            };
        }

        if (!Number.isInteger(row.windowIndex)) {
            return {
                ready: false,
                reason:
                    `Feature row ${i + 1} must contain an integer windowIndex`
            };
        }

        if (
            i > 0 &&
            row.windowIndex !==
                rows[i - 1].windowIndex + 1
        ) {
            return {
                ready: false,
                reason:
                    "Feature windows must be consecutive"
            };
        }

        if (!validateFeatureRow(row.features)) {
            return {
                ready: false,
                reason:
                    `Feature row ${i + 1} must contain exactly ${ECG_FEATURES.length} finite values`
            };
        }
    }

    return {
        ready: true,
        reason: null,
        sequenceLength: SEQUENCE_LENGTH,
        featureCount: ECG_FEATURES.length,
        featureNames: ECG_FEATURES,
        sequence: rows.map(
            (row) => row.features
        )
    };
}