function ConnectionStatus({ status = 'DEMO ECG' }) {
  return (
    <div className="connection-status">
      <span className="status-dot online" aria-hidden="true" />
      <span>{status}</span>
    </div>
  );
}

export default ConnectionStatus;
