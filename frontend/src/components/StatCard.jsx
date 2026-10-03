function StatCard({ label, value, hint, accent = 'primary' }) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className={`stat-accent ${accent}`} aria-hidden="true" />
        <span className="stat-label">{label}</span>
      </div>
      <h3>{value}</h3>
      <p>{hint}</p>
    </div>
  );
}

export default StatCard;
