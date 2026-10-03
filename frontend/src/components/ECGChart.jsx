import { useMemo } from 'react';

function ECGChart({ series = [], title = 'DEMO ECG SIGNAL' }) {
  const path = useMemo(() => {
    if (!series.length) {
      return '';
    }

    const width = 760;
    const height = 180;
    const leftPad = 16;
    const rightPad = 16;
    const minValue = Math.min(...series);
    const maxValue = Math.max(...series);
    const range = Math.max(1, maxValue - minValue);

    return series
      .map((value, index) => {
        const x = leftPad + (index / (series.length - 1)) * (width - leftPad - rightPad);
        const y = height - 18 - ((value - minValue) / range) * (height - 36);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [series]);

  return (
    <div className="chart-card">
      <div className="section-header">
        <h3>{title}</h3>
        <span className="tag muted">DEMO ECG</span>
      </div>

      <svg viewBox="0 0 760 180" className="ecg-svg" preserveAspectRatio="none" role="img" aria-label="ECG waveform">
        <defs>
          <linearGradient id="ecgGradient" x1="0" x2="1">
            <stop offset="0%" stopColor="#1fa6c5" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3fa8ff" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3, 4].map((line) => (
          <line
            key={line}
            x1="0"
            x2="760"
            y1={20 + line * 35}
            y2={20 + line * 35}
            stroke="#e4eef7"
            strokeWidth="1"
          />
        ))}

        <path d={path} fill="none" stroke="#1fa6c5" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default ECGChart;
