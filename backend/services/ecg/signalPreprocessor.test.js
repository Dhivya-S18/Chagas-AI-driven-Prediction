import test from 'node:test';
import assert from 'node:assert/strict';
import { ECGProcessingError, preprocessECGSignal, validateRawECG } from './signalPreprocessor.js';

test('accepts a finite raw signal with a known positive sampling rate', () => {
  const input = { samples: [0, -0.2, 0.4, 0.1], samplingRate: 250 };
  assert.deepEqual(validateRawECG(input), input);
});

test('rejects missing or empty samples', () => {
  for (const input of [{ samplingRate: 250 }, { samples: [], samplingRate: 250 }]) {
    assert.throws(() => validateRawECG(input), ECGProcessingError);
  }
});

test('rejects invalid sampling rates', () => {
  for (const samplingRate of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, '250', 10_001]) {
    assert.throws(() => validateRawECG({ samples: [1], samplingRate }), ECGProcessingError);
  }
});

test('rejects non-numeric and non-finite samples', () => {
  for (const samples of [[1, '2'], [1, Number.NaN], [1, Number.NEGATIVE_INFINITY]]) {
    assert.throws(() => validateRawECG({ samples, samplingRate: 250 }), ECGProcessingError);
  }
});

test('preprocessing returns finite samples and disclaims signal-quality assessment', () => {
  const result = preprocessECGSignal({ samples: [1, 3, 2, 5, 4], samplingRate: 250 });
  assert.equal(result.samples.length, 5);
  assert.ok(result.samples.every(Number.isFinite));
  assert.equal(result.status, 'experimental');
  assert.equal(result.signalQuality.status, 'unassessed');
});
