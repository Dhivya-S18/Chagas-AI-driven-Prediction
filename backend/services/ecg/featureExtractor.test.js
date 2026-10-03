import test from "node:test";
import assert from "node:assert/strict";

import {
    ECG_FEATURES,
    extractFeatureRow
} from "./featureExtractor.js";

test("ECG feature schema contains exactly 26 features", () => {
    assert.equal(ECG_FEATURES.length, 26);
});

test("ECG feature schema contains expected HRV features", () => {
    assert.ok(
        ECG_FEATURES.includes("HRV_MeanNN")
    );

    assert.ok(
        ECG_FEATURES.includes("HRV_SDNN")
    );

    assert.ok(
        ECG_FEATURES.includes("HRV_RMSSD")
    );

    assert.ok(
        ECG_FEATURES.includes("HRV_pNN50")
    );
});

test("ECG feature schema contains demographic features", () => {
    assert.ok(
        ECG_FEATURES.includes("age")
    );

    assert.ok(
        ECG_FEATURES.includes("is_male")
    );
});

test("feature extraction rejects invalid age", () => {
    const result = extractFeatureRow({
        samples: [0, 1, 0, 1, 0],
        samplingRate: 250,
        age: -1,
        isMale: 1
    });

    assert.equal(result.ready, false);
});

test("feature extraction rejects invalid gender encoding", () => {
    const result = extractFeatureRow({
        samples: [0, 1, 0, 1, 0],
        samplingRate: 250,
        age: 25,
        isMale: 2
    });

    assert.equal(result.ready, false);
});

test("feature extraction rejects missing ECG samples", () => {
    const result = extractFeatureRow({
        samples: [],
        samplingRate: 250,
        age: 25,
        isMale: 1
    });

    assert.equal(result.ready, false);
});

test("feature extraction does not fabricate unavailable features", () => {
    const result = extractFeatureRow({
        samples: [0, 1, 0, 1, 0],
        samplingRate: 250,
        age: 25,
        isMale: 1
    });

    assert.equal(result.ready, false);
    assert.ok(result.reason);
});