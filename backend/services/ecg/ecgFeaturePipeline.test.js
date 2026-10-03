import test from "node:test";
import assert from "node:assert/strict";

import {
    buildECGFeatureSequence
} from "./ecgFeaturePipeline.js";

test("pipeline rejects insufficient ECG recording", () => {
    const result = buildECGFeatureSequence({
        samples: Array.from(
            { length: 1000 },
            () => 0
        ),
        samplingRate: 250,
        age: 25,
        isMale: 1
    });

    assert.equal(result.ready, false);
    assert.ok(result.reason);
});

test("pipeline never fabricates a sequence", () => {
    const samples = Array.from(
        { length: 25000 },
        () => 0
    );

    const result = buildECGFeatureSequence({
        samples,
        samplingRate: 250,
        age: 25,
        isMale: 1
    });

    /*
     * A flat signal must not become a fake
     * 10 x 26 ML input.
     */
    assert.equal(result.ready, false);
});