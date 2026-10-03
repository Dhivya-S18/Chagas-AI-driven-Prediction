function PredictionCard({ title = 'AI Analysis', status = 'ECG feature extraction pending', extra = 'No prediction generated.' }) {
  return (
    <div className="info-card">
      <div className="section-header">
        <h3>{title}</h3>
        <span className="tag warning">{status}</span>
      </div>
      <p className="card-note">{extra}</p>
    </div>
  );
}

export default PredictionCard;
