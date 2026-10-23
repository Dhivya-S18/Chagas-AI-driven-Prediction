function PredictionCard({ title = 'AI analysis', status = 'ML Integration Pending', extra = 'No verified prediction yet.' }) {
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
