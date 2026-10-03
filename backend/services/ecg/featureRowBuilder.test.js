import test from 'node:test';
import assert from 'node:assert/strict';
import { ML_FEATURE_NAMES } from '../mlFeatureSchema.js';
import { buildFeatureRow } from './featureRowBuilder.js';

const validInputs = () => ({
  morphology: {
    features: Object.fromEntries(ML_FEATURE_NAMES.slice(0, 20).map((name, index) => [name, index + 1])),
  },
  hrv: {
    features: Object.fromEntries(ML_FEATURE_NAMES.slice(20, 24).map((name, index) => [name, index + 21])),
  },
  demographics: { features: { age: 42, is_male: 1 } },
});

test('builds a finite feature row in exact model schema order only when complete', () => {
  const result = buildFeatureRow(validInputs());
  assert.equal(result.status, 'ready');
  assert.equal(result.featureCount, 26);
  assert.deepEqual(result.featureRow, [...ML_FEATURE_NAMES.slice(0, 24).map((_, index) => index + 1), 42, 1]);
  assert.ok(result.featureRow.every(Number.isFinite));
});

test('rejects a feature row when any required value is missing or non-finite', () => {
  const missing = validInputs();
  delete missing.morphology.features.PR_interval_mean;
  const missingResult = buildFeatureRow(missing);
  assert.equal(missingResult.status, 'unavailable');
  assert.equal(missingResult.features, null);
  assert.equal(missingResult.featureRow, null);
  assert.deepEqual(missingResult.missingGroups, ['PR_interval']);

  const nonFinite = validInputs();
  nonFinite.hrv.features.HRV_RMSSD = Number.NaN;
  const nonFiniteResult = buildFeatureRow(nonFinite);
  assert.equal(nonFiniteResult.status, 'unavailable');
  assert.deepEqual(nonFiniteResult.missingGroups, ['HRV']);
});
