const isClassZero = (value) => value === 0 || value === '0';
const isClassOne = (value) => value === 1 || value === '1';

export const getModelOutputLabel = (analysis) => {
  const prediction = analysis?.prediction;
  const modelClass =
    prediction &&
    typeof prediction === 'object' &&
    !Array.isArray(prediction)
      ? prediction.class
      : prediction;

  if (isClassZero(modelClass)) {
    return 'Chagas Not Detected';
  }

  if (isClassOne(modelClass)) {
    return 'Chagas Detected';
  }

  const modelLabel =
    prediction &&
    typeof prediction === 'object' &&
    !Array.isArray(prediction)
      ? prediction.prediction
      : prediction;

  if (
    typeof modelLabel === 'string' &&
    modelLabel.trim() &&
    !Number.isFinite(Number(modelLabel))
  ) {
    return modelLabel.trim();
  }

  return 'Unavailable';
};

export const getAnalysisClassLabel = (analysis) => {
  const modelOutput = getModelOutputLabel(analysis);

  if (modelOutput === 'Chagas Not Detected') {
    return 'Non-Chagas';
  }

  if (modelOutput === 'Chagas Detected') {
    return 'Chagas';
  }

  return modelOutput;
};

export const getRawModelScore = (analysis) => {
  const prediction = analysis?.prediction;
  const score =
    prediction &&
    typeof prediction === 'object' &&
    !Array.isArray(prediction) &&
    typeof prediction.score === 'number' &&
    Number.isFinite(prediction.score)
      ? prediction.score
      : analysis?.probability;

  return typeof score === 'number' && Number.isFinite(score)
    ? score
    : null;
};

export const formatRawModelScore = (score) =>
  typeof score === 'number' && Number.isFinite(score)
    ? String(score)
    : 'Unavailable';

export const getLatestEligibleRecording = (recordings) => {
  if (!Array.isArray(recordings)) {
    return null;
  }

  return recordings
    .filter((recording) => {
      const recordedAt = new Date(recording?.recordedAt);

      return (
        recording?.source !== 'DEMO' &&
        recording?.mlFeatureSequenceAvailable === true &&
        Boolean(recording?._id) &&
        !Number.isNaN(recordedAt.getTime())
      );
    })
    .sort((left, right) => {
      const timeDifference =
        new Date(right.recordedAt).getTime() -
        new Date(left.recordedAt).getTime();

      if (timeDifference !== 0) {
        return timeDifference;
      }

      return String(right._id).localeCompare(String(left._id));
    })[0] || null;
};
