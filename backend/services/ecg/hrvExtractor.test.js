import test from "node:test";
import assert from "node:assert/strict";

import {
    extractHRV
} from "./hrvExtractor.js";

test("calculates HRV features from valid R-peaks", () => {
    const peaks = [
        0,
        250,
        500,
        750,
        1000,
        1250
    ];

    const result = extractHRV(
        peaks,
        250
    );

    assert.equal(result.available, true);

    assert.equal(
        result.features.HRV_MeanNN,
        1000
    );

    assert.equal(
        result.features.HRV_SDNN,
        0
    );

    assert.equal(
        result.features.HRV_RMSSD,
        0
    );

    assert.equal(
        result.features.HRV_pNN50,
        0
    );
});

test("calculates changing RR intervals", () => {
    const peaks = [
        0,
        250,
        500,
        760,
        1000,
        1260
    ];

    const result = extractHRV(
        peaks,
        250
    );

    assert.equal(result.available, true);

    assert.ok(
        Number.isFinite(
            result.features.HRV_MeanNN
        )
    );

    assert.ok(
        Number.isFinite(
            result.features.HRV_SDNN
        )
    );

    assert.ok(
        Number.isFinite(
            result.features.HRV_RMSSD
        )
    );

    assert.ok(
        Number.isFinite(
            result.features.HRV_pNN50
        )
    );
});

test("rejects too few R-peaks", () => {
    const result = extractHRV(
        [100, 300],
        250
    );

    assert.equal(
        result.available,
        false
    );
});

test("rejects invalid sampling rate", () => {
    const result = extractHRV(
        [100, 300, 500],
        0
    );

    assert.equal(
        result.available,
        false
    );
});

test("rejects unordered R-peaks", () => {
    const result = extractHRV(
        [100, 300, 200, 500],
        250
    );

    assert.equal(
        result.available,
        false
    );
});