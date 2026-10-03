export const generateDemoWaveform = (length = 220, baseline = 42) => {
  const samples = [];

  for (let index = 0; index < length; index += 1) {
    const pWave = Math.sin((index / 25) * 2 * Math.PI) * 5;
    const qrs = Math.exp(-Math.pow((index - 65) / 9, 2)) * 24;
    const tWave = Math.sin((index / 36) * 2 * Math.PI + 0.9) * 9;
    const drift = Math.sin(index / 14) * 3;
    const noise = (Math.random() - 0.5) * 3;

    const sample = baseline + pWave + qrs + tWave + drift + noise;
    samples.push(Number(sample.toFixed(2)));
  }

  return samples;
};

