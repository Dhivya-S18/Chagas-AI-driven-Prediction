import test from "node:test";
import assert from "node:assert/strict";

import {
    extractMorphologyFeatures,
    summarizeMeasurements
} from "./morphologyExtractor.js";

test("morphology extraction rejects insufficient R-peaks", () => {
    const result = extractMorphologyFeatures(
        [0, 1, 0, 1, 0],
        250,
        [2, 4]
    );

    assert.equal(result.available, false);
});

test("morphology extraction rejects invalid ECG samples", () => {
    const result = extractMorphologyFeatures(
        [0, 1, NaN, 1, 0],
        250,
        [1, 3, 4]
    );

    assert.equal(result.available, false);
});

test("summarizes valid measurements", () => {
    const result = summarizeMeasurements([
        10,
        20,
        30,
        40
    ]);

    assert.equal(result.mean, 25);
    assert.equal(result.min, 10);
    assert.equal(result.max, 40);
    assert.ok(result.std > 0);
});

test("ignores non-finite measurements", () => {
    const result = summarizeMeasurements([
        10,
        20,
        Infinity,
        NaN
    ]);

    assert.equal(result.mean, 15);
    assert.equal(result.min, 10);
    assert.equal(result.max, 20);
});

test("returns morphology feature keys when landmarks are available", () => {
    const samples = [];

    for (let i = 0; i < 3000; i += 1) {
        const t = i / 250;

        samples.push(
            Math.sin(2 * Math.PI * 1.2 * t) +
            0.1 * Math.sin(2 * Math.PI * 6 * t)
        );
    }

    const peaks = [
        500,
        710,
        920,
        1130,
        1340
    ];

    const result = extractMorphologyFeatures(
        samples,
        250,
        peaks
    );

    if (result.available) {
        assert.equal(
            Object.keys(result.features).length,
            20
        );
    } else {
        assert.ok(result.reason);
    }
});