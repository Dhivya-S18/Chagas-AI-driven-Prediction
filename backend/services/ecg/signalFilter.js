const DEFAULT_SAMPLING_RATE = 250;

function movingAverage(samples, windowSize) {
    const result = new Array(samples.length);

    let sum = 0;

    for (let i = 0; i < samples.length; i += 1) {
        sum += samples[i];

        if (i >= windowSize) {
            sum -= samples[i - windowSize];
        }

        const count = Math.min(i + 1, windowSize);

        result[i] = sum / count;
    }

    return result;
}

export function removeBaselineWander(
    samples,
    samplingRate = DEFAULT_SAMPLING_RATE,
) {
    if (!Array.isArray(samples) || samples.length === 0) {
        return [];
    }

    /*
     * Slow moving average estimates the baseline.
     * Subtracting it removes slow baseline drift.
     */
    const baselineWindow = Math.max(
        1,
        Math.round(samplingRate * 0.6),
    );

    const baseline = movingAverage(
        samples,
        baselineWindow,
    );

    return samples.map(
        (sample, index) =>
            sample - baseline[index],
    );
}

export function normalizeSignal(samples) {
    if (!Array.isArray(samples) || samples.length === 0) {
        return [];
    }

    const mean =
        samples.reduce(
            (sum, value) => sum + value,
            0,
        ) / samples.length;

    const centered = samples.map(
        (value) => value - mean,
    );

    const maxAbs = Math.max(
        ...centered.map((value) => Math.abs(value)),
    );

    if (!Number.isFinite(maxAbs) || maxAbs === 0) {
        return centered;
    }

    return centered.map(
        (value) => value / maxAbs,
    );
}

export function preprocessECG(
    samples,
    samplingRate = DEFAULT_SAMPLING_RATE,
) {
    if (!Array.isArray(samples)) {
        throw new Error('ECG samples must be an array.');
    }

    if (samples.length === 0) {
        throw new Error('ECG sample array is empty.');
    }

    const numericSamples = samples.map(
        (value) => Number(value),
    );

    if (
        numericSamples.some(
            (value) => !Number.isFinite(value),
        )
    ) {
        throw new Error(
            'ECG samples must contain only finite numbers.',
        );
    }

    const baselineRemoved =
        removeBaselineWander(
            numericSamples,
            samplingRate,
        );

    const normalized =
        normalizeSignal(baselineRemoved);

    return normalized;
}