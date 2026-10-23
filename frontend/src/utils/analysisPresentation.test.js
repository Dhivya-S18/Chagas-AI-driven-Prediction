import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatRawModelScore,
  getAnalysisClassLabel,
  getLatestEligibleRecording,
  getModelOutputLabel,
  getRawModelScore,
} from './analysisPresentation.js';

test('maps model classes 0 and 1 to readable labels', () => {
  assert.equal(
    getModelOutputLabel({
      prediction: { class: 0, score: 0.2 },
    }),
    'Chagas Not Detected',
  );
  assert.equal(
    getModelOutputLabel({
      prediction: { class: 1, score: 0.8 },
    }),
    'Chagas Detected',
  );
  assert.equal(
    getModelOutputLabel({ prediction: 0 }),
    'Chagas Not Detected',
  );
  assert.equal(
    getModelOutputLabel({ prediction: 1 }),
    'Chagas Detected',
  );
});

test('maps AI Analysis classes to the requested display labels', () => {
  assert.equal(
    getAnalysisClassLabel({ prediction: 0 }),
    'Non-Chagas',
  );
  assert.equal(
    getAnalysisClassLabel({ prediction: 1 }),
    'Chagas',
  );
  assert.equal(
    getAnalysisClassLabel({ prediction: 2 }),
    'Unavailable',
  );
});

test('reads each saved record’s raw model score without converting it', () => {
  assert.equal(
    getRawModelScore({
      prediction: {
        class: 0,
        score: 0.003418691921979189,
      },
    }),
    0.003418691921979189,
  );
  assert.equal(
    formatRawModelScore(
      getRawModelScore({
        prediction: { class: 1, score: 0 },
      }),
    ),
    '0',
  );
});

test('uses an explicit saved probability only as an unconverted value', () => {
  assert.equal(
    getRawModelScore({
      prediction: 0,
      probability: 0.23,
    }),
    0.23,
  );
});

test('returns unavailable for missing or invalid scores and class values', () => {
  assert.equal(
    getRawModelScore({ prediction: { class: 0 } }),
    null,
  );
  assert.equal(
    getRawModelScore({
      prediction: { class: 1, score: Number.NaN },
    }),
    null,
  );
  assert.equal(formatRawModelScore(null), 'Unavailable');
  assert.equal(
    getModelOutputLabel({
      prediction: { class: 2, score: 0.5 },
    }),
    'Unavailable',
  );
});

test('selects only the newest valid, feature-eligible non-demo recording', () => {
  const newestEligible = {
    _id: 'newest',
    source: 'ESP32',
    recordedAt: '2026-10-23T12:00:00.000Z',
    mlFeatureSequenceAvailable: true,
  };

  assert.equal(
    getLatestEligibleRecording([
      {
        _id: 'demo',
        source: 'DEMO',
        recordedAt: '2026-10-24T12:00:00.000Z',
        mlFeatureSequenceAvailable: true,
      },
      {
        _id: 'missing-features',
        source: 'ESP32',
        recordedAt: '2026-10-23T13:00:00.000Z',
        mlFeatureSequenceAvailable: false,
      },
      {
        _id: 'older',
        source: 'ESP32',
        recordedAt: '2026-10-22T12:00:00.000Z',
        mlFeatureSequenceAvailable: true,
      },
      {
        _id: 'invalid-date',
        source: 'ESP32',
        recordedAt: 'invalid',
        mlFeatureSequenceAvailable: true,
      },
      newestEligible,
    ]),
    newestEligible,
  );
  assert.equal(getLatestEligibleRecording([]), null);
});
