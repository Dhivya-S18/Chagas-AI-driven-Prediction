import test from 'node:test';
import assert from 'node:assert/strict';

import {
    getLiveECGStatus,
    startLiveECG,
} from './liveECGService.js';

test('rejects a missing age before starting live monitoring', () => {
    assert.throws(
        () => startLiveECG({
            userId: 'test-user',
            age: undefined,
            gender: undefined,
        }),
        (error) =>
            error.statusCode === 422 &&
            error.message.includes('saved age'),
    );

    assert.equal(
        getLiveECGStatus().monitoring,
        false,
    );
});

test('rejects a missing or unsupported gender before starting live monitoring', () => {
    assert.throws(
        () => startLiveECG({
            userId: 'test-user',
            age: 25,
            gender: undefined,
        }),
        (error) =>
            error.statusCode === 422 &&
            error.message.includes('Male or Female'),
    );

    assert.equal(
        getLiveECGStatus().monitoring,
        false,
    );
});
