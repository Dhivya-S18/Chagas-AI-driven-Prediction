import test from "node:test";
import assert from "node:assert/strict";

import {
    buildFeatureSequence,
    buildConsecutiveFeatureSequence
} from "./featureSequenceBuilder.js";

const validRow = () =>
    Array.from(
        { length: 26 },
        (_, index) => index + 1
    );

test("rejects fewer than 10 rows", () => {
    const rows = Array.from(
        { length: 9 },
        validRow
    );

    const result = buildFeatureSequence(rows);

    assert.equal(result.ready, false);
});

test("rejects more than 10 rows", () => {
    const rows = Array.from(
        { length: 11 },
        validRow
    );

    const result = buildFeatureSequence(rows);

    assert.equal(result.ready, false);
});

test("accepts exactly 10 rows of 26 finite values", () => {
    const rows = Array.from(
        { length: 10 },
        validRow
    );

    const result = buildFeatureSequence(rows);

    assert.equal(result.ready, true);
    assert.equal(result.sequence.length, 10);
    assert.equal(result.sequence[0].length, 26);
});

test("rejects a row with incorrect feature count", () => {
    const rows = Array.from(
        { length: 10 },
        validRow
    );

    rows[5] = Array.from(
        { length: 25 },
        (_, index) => index + 1
    );

    const result = buildFeatureSequence(rows);

    assert.equal(result.ready, false);
});

test("rejects non-finite feature values", () => {
    const rows = Array.from(
        { length: 10 },
        validRow
    );

    rows[3][12] = Infinity;

    const result = buildFeatureSequence(rows);

    assert.equal(result.ready, false);
});

test("accepts consecutive feature windows", () => {
    const rows = Array.from(
        { length: 10 },
        (_, index) => ({
            windowIndex: index,
            features: validRow()
        })
    );

    const result =
        buildConsecutiveFeatureSequence(rows);

    assert.equal(result.ready, true);
    assert.equal(result.sequence.length, 10);
    assert.equal(result.sequence[0].length, 26);
});

test("rejects non-consecutive windows", () => {
    const rows = Array.from(
        { length: 10 },
        (_, index) => ({
            windowIndex: index,
            features: validRow()
        })
    );

    rows[5].windowIndex = 7;

    const result =
        buildConsecutiveFeatureSequence(rows);

    assert.equal(result.ready, false);
});

test("does not pad missing rows", () => {
    const rows = Array.from(
        { length: 8 },
        (_, index) => ({
            windowIndex: index,
            features: validRow()
        })
    );

    const result =
        buildConsecutiveFeatureSequence(rows);

    assert.equal(result.ready, false);
});