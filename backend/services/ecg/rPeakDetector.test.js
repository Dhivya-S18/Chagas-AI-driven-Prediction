import test from "node:test";
import assert from "node:assert/strict";

import {
    detectRPeaks,
    validateRPeaks
} from "./rPeakDetector.js";

test("detects positive local peaks from a finite ECG signal", () => {
    const samples = [
        0, 0.1, 0.2, 1.5, 0.2, 0.1,
        0, 0.1, 0.3, 2.0, 0.3, 0.1,
        0, 0.1, 0.2, 1.8, 0.2, 0
    ];

    const peaks = detectRPeaks(samples, 100);

    assert.ok(Array.isArray(peaks));
    assert.ok(peaks.length > 0);
});

test("returns no peaks for a flat signal", () => {
    const samples = new Array(100).fill(1);

    const peaks = detectRPeaks(samples, 250);

    assert.deepEqual(peaks, []);
});

test("validates R-peak indices", () => {
    const result = validateRPeaks(
        [10, 30, 50],
        100
    );

    assert.equal(result.valid, true);
});

test("rejects malformed R-peak indices", () => {
    const result = validateRPeaks(
        [10, 5, 50],
        100
    );

    assert.equal(result.valid, false);
});

test("rejects R-peaks outside signal bounds", () => {
    const result = validateRPeaks(
        [10, 30, 100],
        100
    );

    assert.equal(result.valid, false);
});