import { ML_FEATURE_NAMES } from './mlFeatureSchema.js';

const HEALTH_TIMEOUT_MS = 3000;
const PREDICTION_TIMEOUT_MS = 20000;

export class MLServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'MLServiceError';
    this.statusCode = statusCode;
  }
}

export const validateFeatureSequence = (sequence) => {
  if (!Array.isArray(sequence)) {
    throw new MLServiceError(
      'A feature sequence array is required.',
      400,
    );
  }

  if (sequence.length !== 10) {
    throw new MLServiceError(
      'Feature sequence must contain exactly 10 rows.',
      400,
    );
  }

  for (let rowIndex = 0; rowIndex < sequence.length; rowIndex += 1) {
    const row = sequence[rowIndex];

    if (
      !Array.isArray(row) ||
      row.length !== ML_FEATURE_NAMES.length
    ) {
      throw new MLServiceError(
        `Feature row ${rowIndex + 1} must contain exactly ${ML_FEATURE_NAMES.length} values.`,
        400,
      );
    }

    for (
      let featureIndex = 0;
      featureIndex < ML_FEATURE_NAMES.length;
      featureIndex += 1
    ) {
      const value = row[featureIndex];

      if (
        typeof value !== 'number' ||
        !Number.isFinite(value)
      ) {
        throw new MLServiceError(
          `Feature ${ML_FEATURE_NAMES[featureIndex]} in row ${rowIndex + 1} must be a finite number.`,
          400,
        );
      }
    }
  }

  return sequence;
};

const requestML = async (path, options, timeoutMs) => {
  const baseUrl = process.env.ML_SERVICE_URL
    ?.trim()
    .replace(/\/+$/, '');

  if (!baseUrl) {
    throw new MLServiceError(
      'ML service URL is not configured.',
      503,
    );
  }

  console.log(`ML request: ${baseUrl}${path}`);

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    let response;

    try {
      response = await fetch(`${baseUrl}${path}`, {
        ...options,
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new MLServiceError(
          path === '/predict'
            ? 'ML analysis timed out.'
            : 'ML health check timed out.',
          504,
        );
      }

      console.error(
        'ML service connection error:',
        error.message,
      );

      throw new MLServiceError(
        'ML service unavailable.',
        503,
      );
    }

    if (!response.ok) {
      if (
        response.status >= 400 &&
        response.status < 500
      ) {
        throw new MLServiceError(
          'ML service rejected the request.',
          422,
        );
      }

      throw new MLServiceError(
        'ML service returned an error.',
        502,
      );
    }

    try {
      const result = await response.json();

      if (
        !result ||
        typeof result !== 'object' ||
        Array.isArray(result)
      ) {
        throw new Error('Invalid response shape.');
      }

      return result;
    } catch (error) {
      if (controller.signal.aborted) {
        throw new MLServiceError(
          path === '/predict'
            ? 'ML analysis timed out.'
            : 'ML health check timed out.',
          504,
        );
      }

      console.error(
        'Invalid ML response:',
        error.message,
      );

      throw new MLServiceError(
        'ML service returned an invalid response.',
        502,
      );
    }
  } finally {
    clearTimeout(timeout);
  }
};

export const checkMLHealth = () =>
  requestML(
    '/health',
    {
      method: 'GET',
    },
    HEALTH_TIMEOUT_MS,
  );

export const predict = (sequence) => {
  validateFeatureSequence(sequence);

  return requestML(
    '/predict',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sequence,
      }),
    },
    PREDICTION_TIMEOUT_MS,
  );
};