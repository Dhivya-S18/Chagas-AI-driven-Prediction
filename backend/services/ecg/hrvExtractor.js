function validatePeaks(rPeaks, samplingRate) {
    if (!Array.isArray(rPeaks)) {
        throw new Error('R-peaks must be an array.');
    }

    if (!Number.isFinite(samplingRate) || samplingRate <= 0) {
        throw new Error('Sampling rate must be positive.');
    }

    if (rPeaks.length < 3) {
        throw new Error(
            'At least 3 R-peaks are required for HRV extraction.',
        );
    }

    for (let i = 0; i < rPeaks.length; i += 1) {
        if (!Number.isInteger(rPeaks[i]) || rPeaks[i] < 0) {
            throw new Error('R-peak indices must be valid integers.');
        }

        if (
            i > 0 &&
            rPeaks[i] <= rPeaks[i - 1]
        ) {
            throw new Error(
                'R-peaks must be strictly increasing.',
            );
        }
    }
}

function mean(values) {
    return (
        values.reduce(
            (sum, value) => sum + value,
            0,
        ) / values.length
    );
}

function standardDeviation(values) {
    const average = mean(values);

    const variance =
        values.reduce(
            (sum, value) =>
                sum + (value - average) ** 2,
            0,
        ) / values.length;

    return Math.sqrt(variance);
}

export function extractHRVFeatures(
    rPeaks,
    samplingRate,
) {
    validatePeaks(rPeaks, samplingRate);

    /*
     * Convert R-peak positions from samples
     * to milliseconds.
     */
    const rrIntervals = [];

    for (let i = 1; i < rPeaks.length; i += 1) {
        const interval =
            ((rPeaks[i] - rPeaks[i - 1]) /
                samplingRate) *
            1000;

        if (
            Number.isFinite(interval) &&
            interval > 0
        ) {
            rrIntervals.push(interval);
        }
    }

    if (rrIntervals.length < 2) {
        throw new Error(
            'Not enough valid RR intervals for HRV extraction.',
        );
    }

    // HRV_MeanNN
    const meanNN = mean(rrIntervals);

    // HRV_SDNN
    const sdnn =
        standardDeviation(rrIntervals);

    // HRV_RMSSD
    const successiveDifferences = [];

    for (
        let i = 1;
        i < rrIntervals.length;
        i += 1
    ) {
        successiveDifferences.push(
            rrIntervals[i] -
                rrIntervals[i - 1],
        );
    }

    const squaredDifferences =
        successiveDifferences.map(
            (difference) =>
                difference ** 2,
        );

    const rmssd = Math.sqrt(
        mean(squaredDifferences),
    );

    // HRV_pNN50
    const nn50Count =
        successiveDifferences.filter(
            (difference) =>
                Math.abs(difference) > 50,
        ).length;

    const pNN50 =
        (nn50Count /
            successiveDifferences.length) *
        100;

    return {
        HRV_MeanNN: meanNN,
        HRV_SDNN: sdnn,
        HRV_RMSSD: rmssd,
        HRV_pNN50: pNN50,
    };
}
export function extractHRV(
    rPeaks,
    samplingRate,
) {
    try {
        const features =
            extractHRVFeatures(
                rPeaks,
                samplingRate,
            );

        return {
            available: true,
            reason: null,
            features,
        };
    } catch (error) {
        return {
            available: false,
            reason: error.message,
            features: null,
        };
    }
}