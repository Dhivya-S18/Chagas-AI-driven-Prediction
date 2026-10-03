const MAX_SAMPLES = 1_000_000;
const MAX_SAMPLING_RATE = 10_000;

export class ECGProcessingError extends Error {
  constructor(message, statusCode = 422) {
    super(message);
    this.name = 'ECGProcessingError';
    this.statusCode = statusCode;
  }
}

export const validateRawECG = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ECGProcessingError('ECG input must be an object.', 400);
  }

  const { samples, samplingRate } = input;
  if (!Array.isArray(samples) || samples.length === 0) {
    throw new ECGProcessingError('A non-empty samples array is required.', 400);
  }
  if (samples.length > MAX_SAMPLES) {
    throw new ECGProcessingError(`ECG input cannot exceed ${MAX_SAMPLES} samples.`, 413);
  }
  if (
    typeof samplingRate !== 'number'
    || !Number.isFinite(samplingRate)
    || samplingRate <= 0
    || samplingRate > MAX_SAMPLING_RATE
  ) {
    throw new ECGProcessingError(`samplingRate must be a finite number greater than 0 and no more than ${MAX_SAMPLING_RATE} Hz.`, 400);
  }

  for (let index = 0; index < samples.length; index += 1) {
    if (typeof samples[index] !== 'number' || !Number.isFinite(samples[index])) {
      throw new ECGProcessingError(`ECG sample ${index} must be a finite number.`, 400);
    }
  }

  return { samples, samplingRate };
};

const centeredMovingAverage = (values, windowSize) => {
  const prefixSums = new Float64Array(values.length + 1);
  for (let index = 0; index < values.length; index += 1) {
    prefixSums[index + 1] = prefixSums[index] + values[index];
  }

  const radius = Math.floor(windowSize / 2);
  return values.map((_, index) => {
    const start = Math.max(0, index - radius);
    const end = Math.min(values.length, index + radius + 1);
    return (prefixSums[end] - prefixSums[start]) / (end - start);
  });
};

const oddWindow = (samplesPerSecond, seconds) => {
  const size = Math.max(3, Math.round(samplesPerSecond * seconds));
  return size % 2 === 0 ? size + 1 : size;
};

export const preprocessECGSignal = (input) => {
  const { samples, samplingRate } = validateRawECG(input);
  const baseline = centeredMovingAverage(samples, oddWindow(samplingRate, 0.6));
  const baselineCorrected = samples.map((sample, index) => sample - baseline[index]);
  const filteredSamples = centeredMovingAverage(baselineCorrected, oddWindow(samplingRate, 0.04));

  return {
    samples: filteredSamples,
    samplingRate,
    status: 'experimental',
    signalQuality: {
      status: 'unassessed',
      message: 'No calibrated signal-quality assessment is implemented.',
    },
    notes: [
      'Exploratory moving-average baseline removal and smoothing only; not clinically validated.',
      'Filtering parameters require validation for the actual ECG device and acquisition settings.',
    ],
  };
};
