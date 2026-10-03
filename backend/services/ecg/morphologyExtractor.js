function mean(values) {
    if (values.length === 0) {
        return null;
    }

    return (
        values.reduce(
            (sum, value) => sum + value,
            0,
        ) / values.length
    );
}

function standardDeviation(values) {
    if (values.length === 0) {
        return null;
    }

    const average = mean(values);

    const variance =
        values.reduce(
            (sum, value) =>
                sum + (value - average) ** 2,
            0,
        ) / values.length;

    return Math.sqrt(variance);
}

function summary(values, prefix) {
    if (values.length === 0) {
        return {
            [`${prefix}_mean`]: null,
            [`${prefix}_std`]: null,
            [`${prefix}_min`]: null,
            [`${prefix}_max`]: null,
        };
    }

    return {
        [`${prefix}_mean`]: mean(values),
        [`${prefix}_std`]:
            standardDeviation(values),
        [`${prefix}_min`]:
            Math.min(...values),
        [`${prefix}_max`]:
            Math.max(...values),
    };
}

function findLocalMinimum(
    signal,
    start,
    end,
) {
    const safeStart = Math.max(
        0,
        Math.floor(start),
    );

    const safeEnd = Math.min(
        signal.length - 1,
        Math.floor(end),
    );

    if (safeStart > safeEnd) {
        return null;
    }

    let index = safeStart;

    for (
        let i = safeStart + 1;
        i <= safeEnd;
        i += 1
    ) {
        if (signal[i] < signal[index]) {
            index = i;
        }
    }

    return index;
}

function findLocalMaximum(
    signal,
    start,
    end,
) {
    const safeStart = Math.max(
        0,
        Math.floor(start),
    );

    const safeEnd = Math.min(
        signal.length - 1,
        Math.floor(end),
    );

    if (safeStart > safeEnd) {
        return null;
    }

    let index = safeStart;

    for (
        let i = safeStart + 1;
        i <= safeEnd;
        i += 1
    ) {
        if (signal[i] > signal[index]) {
            index = i;
        }
    }

    return index;
}

function durationMs(
    startIndex,
    endIndex,
    samplingRate,
) {
    if (
        startIndex === null ||
        endIndex === null ||
        endIndex <= startIndex
    ) {
        return null;
    }

    return (
        ((endIndex - startIndex) /
            samplingRate) *
        1000
    );
}

/*
 * Experimental single-channel ECG morphology
 * extraction.
 *
 * This is not clinically validated.
 *
 * Supports both argument orders:
 *
 * 1. extractMorphologyFeatures(
 *        signal,
 *        rPeaks,
 *        samplingRate
 *    )
 *
 * 2. extractMorphologyFeatures(
 *        signal,
 *        samplingRate,
 *        rPeaks
 *    )
 */
export function extractMorphologyFeatures(
    signal,
    rPeaksOrSamplingRate,
    samplingRateOrRPeaks,
) {
    let rPeaks;
    let samplingRate;

    /*
     * Detect which argument order was supplied.
     */
    if (Array.isArray(rPeaksOrSamplingRate)) {
        rPeaks = rPeaksOrSamplingRate;
        samplingRate = samplingRateOrRPeaks;
    } else {
        samplingRate = rPeaksOrSamplingRate;
        rPeaks = samplingRateOrRPeaks;
    }

    /*
     * Validate ECG signal.
     */
    if (
        !Array.isArray(signal) ||
        signal.length === 0
    ) {
        return {
            ready: false,
            available: false,
            reason: "ECG signal is empty.",
        };
    }

    /*
     * Validate ECG samples.
     */
    if (
        signal.some(
            (value) =>
                typeof value !== "number" ||
                !Number.isFinite(value),
        )
    ) {
        return {
            ready: false,
            available: false,
            reason:
                "ECG signal contains invalid samples.",
        };
    }

    /*
     * Validate R-peaks.
     */
    if (
        !Array.isArray(rPeaks) ||
        rPeaks.length === 0
    ) {
        return {
            ready: false,
            available: false,
            reason: "R-peaks are required.",
        };
    }

    /*
     * Validate sampling rate.
     */
    if (
        !Number.isFinite(samplingRate) ||
        samplingRate <= 0
    ) {
        return {
            ready: false,
            available: false,
            reason:
                "Sampling rate must be positive.",
        };
    }

    const prIntervals = [];
    const qrsDurations = [];
    const qtIntervals = [];
    const stSegments = [];
    const stSlopes = [];

    /*
     * Approximate morphology windows
     * around each R peak.
     */
    for (const rPeak of rPeaks) {
        if (
            !Number.isInteger(rPeak) ||
            rPeak < 0 ||
            rPeak >= signal.length
        ) {
            continue;
        }

        /*
         * Approximate P-wave region.
         */
        const pStart =
            rPeak -
            Math.round(
                samplingRate * 0.30,
            );

        const pEnd =
            rPeak -
            Math.round(
                samplingRate * 0.12,
            );

        const pPeak = findLocalMaximum(
            signal,
            pStart,
            pEnd,
        );

        /*
         * Approximate Q point.
         */
        const qIndex = findLocalMinimum(
            signal,
            rPeak -
                Math.round(
                    samplingRate * 0.08,
                ),
            rPeak -
                Math.round(
                    samplingRate * 0.01,
                ),
        );

        /*
         * Approximate S point.
         */
        const sIndex = findLocalMinimum(
            signal,
            rPeak +
                Math.round(
                    samplingRate * 0.01,
                ),
            rPeak +
                Math.round(
                    samplingRate * 0.12,
                ),
        );

        /*
         * Approximate T-wave region.
         */
        const tPeak = findLocalMaximum(
            signal,
            rPeak +
                Math.round(
                    samplingRate * 0.12,
                ),
            rPeak +
                Math.round(
                    samplingRate * 0.45,
                ),
        );

        /*
         * PR interval.
         */
        const pr = durationMs(
            pPeak,
            qIndex,
            samplingRate,
        );

        if (
            pr !== null &&
            pr > 0
        ) {
            prIntervals.push(pr);
        }

        /*
         * QRS duration.
         */
        const qrs = durationMs(
            qIndex,
            sIndex,
            samplingRate,
        );

        if (
            qrs !== null &&
            qrs > 0
        ) {
            qrsDurations.push(qrs);
        }

        /*
         * QT interval.
         */
        const qt = durationMs(
            qIndex,
            tPeak,
            samplingRate,
        );

        if (
            qt !== null &&
            qt > 0
        ) {
            qtIntervals.push(qt);
        }

        /*
         * ST segment:
         * approximately 80 ms after
         * the R peak.
         */
        const stIndex =
            rPeak +
            Math.round(
                samplingRate * 0.08,
            );

        const stEndIndex =
            rPeak +
            Math.round(
                samplingRate * 0.16,
            );

        if (
            stIndex >= 0 &&
            stEndIndex < signal.length
        ) {
            const stValue =
                signal[stIndex];

            stSegments.push(stValue);

            const delta =
                signal[stEndIndex] -
                signal[stIndex];

            const deltaTime =
                (stEndIndex - stIndex) /
                samplingRate;

            if (deltaTime > 0) {
                stSlopes.push(
                    delta / deltaTime,
                );
            }
        }
    }

    /*
     * Create all 20 morphology features.
     */
    const result = {
        ...summary(
            prIntervals,
            "PR_interval",
        ),

        ...summary(
            qrsDurations,
            "QRS_duration",
        ),

        ...summary(
            qtIntervals,
            "QT_interval",
        ),

        ...summary(
            stSegments,
            "ST_segment",
        ),

        ...summary(
            stSlopes,
            "ST_slope",
        ),
    };

    /*
     * Require exactly 20 finite morphology
     * features.
     */
    const values =
        Object.values(result);

    if (
        values.length !== 20 ||
        values.some(
            (value) =>
                typeof value !== "number" ||
                !Number.isFinite(value),
        )
    ) {
        return {
            ready: false,
            available: false,
            reason:
                "Unable to extract all 20 ECG morphology features from this signal.",
        };
    }

    return {
        ready: true,
        available: true,
        features: result,
    };
}

/*
 * Compatibility helper used by the existing tests.
 *
 * Non-finite measurements such as NaN and Infinity
 * are ignored.
 */
export function summarizeMeasurements(
    values,
) {
    const validValues =
        Array.isArray(values)
            ? values.filter(
                  (value) =>
                      typeof value === "number" &&
                      Number.isFinite(value),
              )
            : [];

    if (validValues.length === 0) {
        return {
            mean: null,
            std: null,
            min: null,
            max: null,
        };
    }

    return {
        mean: mean(validValues),
        std: standardDeviation(
            validValues,
        ),
        min: Math.min(...validValues),
        max: Math.max(...validValues),
    };
}