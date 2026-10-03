function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}

/**
 * Split a continuous ECG recording into non-overlapping windows.
 *
 * No padding and no duplicated samples are used.
 */
export function segmentECG(
    samples,
    samplingRate,
    windowSeconds = 10
) {
    if (!Array.isArray(samples) || samples.length === 0) {
        return {
            ready: false,
            reason: "ECG samples are required"
        };
    }

    if (
        !isFiniteNumber(samplingRate) ||
        samplingRate <= 0
    ) {
        return {
            ready: false,
            reason: "Sampling rate must be positive"
        };
    }

    if (
        !isFiniteNumber(windowSeconds) ||
        windowSeconds <= 0
    ) {
        return {
            ready: false,
            reason: "Window duration must be positive"
        };
    }

    if (
        samples.some(
            (value) => !isFiniteNumber(value)
        )
    ) {
        return {
            ready: false,
            reason: "ECG samples must be finite"
        };
    }

    const windowSize = Math.floor(
        samplingRate * windowSeconds
    );

    if (windowSize <= 0) {
        return {
            ready: false,
            reason: "Invalid ECG window size"
        };
    }

    const windows = [];

    for (
        let start = 0;
        start + windowSize <= samples.length;
        start += windowSize
    ) {
        const end = start + windowSize;

        windows.push({
            windowIndex: windows.length,
            startSample: start,
            endSample: end,
            samples: samples.slice(start, end)
        });
    }

    if (windows.length === 0) {
        return {
            ready: false,
            reason:
                "ECG recording is shorter than one complete window"
        };
    }

    return {
        ready: true,
        reason: null,
        windowSize,
        windowSeconds,
        windows
    };
}