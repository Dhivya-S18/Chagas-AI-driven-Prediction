import { ML_FEATURE_NAMES } from '../mlFeatureSchema.js';

const FEATURE_GROUPS = Object.freeze({
  PR_interval: ML_FEATURE_NAMES.slice(0, 4),
  QRS_duration: ML_FEATURE_NAMES.slice(4, 8),
  QT_interval: ML_FEATURE_NAMES.slice(8, 12),
  ST_segment: ML_FEATURE_NAMES.slice(12, 16),
  ST_slope: ML_FEATURE_NAMES.slice(16, 20),
  HRV: ML_FEATURE_NAMES.slice(20, 24),
  demographics: ML_FEATURE_NAMES.slice(24, 26),
});

export const buildFeatureRow = ({ morphology, hrv, demographics }) => {
  const candidateValues = {
    ...(morphology?.features || {}),
    ...(hrv?.features || {}),
    ...(demographics?.features || {}),
  };
  const missingFeatures = ML_FEATURE_NAMES.filter((name) =>
    typeof candidateValues[name] !== 'number' || !Number.isFinite(candidateValues[name]),
  );
  const missingGroups = Object.entries(FEATURE_GROUPS)
    .filter(([, names]) => names.some((name) => missingFeatures.includes(name)))
    .map(([group]) => group);

  if (missingFeatures.length > 0) {
    return {
      status: 'unavailable',
      features: null,
      featureRow: null,
      featureCount: 0,
      missingFeatures,
      missingGroups,
      message: `Feature row unavailable; missing or invalid feature groups: ${missingGroups.join(', ')}.`,
    };
  }

  return {
    status: 'ready',
    features: Object.fromEntries(ML_FEATURE_NAMES.map((name) => [name, candidateValues[name]])),
    featureRow: ML_FEATURE_NAMES.map((name) => candidateValues[name]),
    featureCount: ML_FEATURE_NAMES.length,
    missingFeatures: [],
    missingGroups: [],
    message: null,
  };
};
