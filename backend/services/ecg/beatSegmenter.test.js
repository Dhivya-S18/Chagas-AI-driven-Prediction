import test from "node:test";
import assert from "node:assert/strict";

import {
    segmentECG
} from "./beatSegmenter.js";

test("creates non-overlapping ECG windows", () => {
    const samples = Array.from(
        { length: 1000 },
        (_, index) => index
    );

    const result = segmentECG(
        samples,
        100,
        5
    );

    assert.equal(result.ready, true);
    assert.equal(result.windows.length, 2);

    assert.equal(
        result.windows[0].startSample,
        0
    );

    assert.equal(
        result.windows[0].endSample,
        500
    );

    assert.equal(
        result.windows[1].startSample,
        500
    );

    assert.equal(
        result.windows[1].endSample,
        1000
    );
});

test("does not create partial windows", () => {
    const samples = Array.from(
        { length: 750 },
        (_, index) => index
    );

    const result = segmentECG(
        samples,
        100,
        5
    );

    assert.equal(result.ready, true);
    assert.equal(result.windows.length, 1);
});

test("does not pad a short recording", () => {
    const samples = Array.from(
        { length: 400 },
        (_, index) => index
    );

    const result = segmentECG(
        samples,
        100,
        5
    );

    assert.equal(result.ready, false);
});

test("rejects invalid sampling rate", () => {
    const result = segmentECG(
        [1, 2, 3],
        0,
        5
    );

    assert.equal(result.ready, false);
});

test("rejects non-finite samples", () => {
    const result = segmentECG(
        [1, 2, Infinity, 4],
        100,
        1
    );

    assert.equal(result.ready, false);
});