function isFiniteNumber(value) {
    return (
        typeof value === "number" &&
        Number.isFinite(value)
    );
}

export function detectRPeaks(
    samples,
    samplingRate,
) {
    if (
        !Array.isArray(samples) ||
        samples.length === 0
    ) {
        return [];
    }

    if (
        !isFiniteNumber(samplingRate) ||
        samplingRate <= 0
    ) {
        return [];
    }

    const numericSamples = samples.map(Number);

    if (
        numericSamples.some(
            (value) => !Number.isFinite(value),
        )
    ) {
        return [];
    }

    const mean =
        numericSamples.reduce(
            (sum, value) => sum + value,
            0,
        ) / numericSamples.length;

    const variance =
        numericSamples.reduce(
            (sum, value) =>
                sum +
                Math.pow(value - mean, 2),
            0,
        ) / numericSamples.length;

    const standardDeviation =
        Math.sqrt(variance);
    if (standardDeviation === 0) {
    return [];
}
    const threshold =
        mean + 0.5 * standardDeviation;

    // Minimum distance between R-peaks:
    // 200 ms refractory period.
    const minimumDistance = Math.max(
        1,
        Math.round(samplingRate * 0.2),
    );

    const peaks = [];

    for (
        let index = 1;
        index < numericSamples.length - 1;
        index += 1
    ) {
        const current =
            numericSamples[index];

        if (current < threshold) {
            continue;
        }

        if (
            current < numericSamples[index - 1] ||
            current < numericSamples[index + 1]
        ) {
            continue;
        }

        const lastPeak =
            peaks[peaks.length - 1];

        if (
            lastPeak !== undefined &&
            index - lastPeak < minimumDistance
        ) {
            // Keep the larger peak when two
            // candidates are too close.
            if (
                current >
                numericSamples[lastPeak]
            ) {
                peaks[peaks.length - 1] =
                    index;
            }

            continue;
        }

        peaks.push(index);
    }

    return peaks;
}

export function validateRPeaks(
    peaks,
    signalLength,
) {
    if (!Array.isArray(peaks)) {
        return {
            valid: false,
            reason: "R-peaks must be an array",
        };
    }

    if (
        !Number.isInteger(signalLength) ||
        signalLength <= 0
    ) {
        return {
            valid: false,
            reason:
                "Signal length must be a positive integer",
        };
    }

    for (
        let index = 0;
        index < peaks.length;
        index += 1
    ) {
        const peak = peaks[index];

        if (
            !Number.isInteger(peak) ||
            peak < 0 ||
            peak >= signalLength
        ) {
            return {
                valid: false,
                reason:
                    "R-peak index is outside signal bounds",
            };
        }

        if (
            index > 0 &&
            peak <= peaks[index - 1]
        ) {
            return {
                valid: false,
                reason:
                    "R-peaks must be strictly increasing",
            };
        }
    }

    return {
        valid: true,
        reason: null,
    };
}