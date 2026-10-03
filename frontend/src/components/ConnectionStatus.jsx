function ConnectionStatus({ status = 'Demo Mode' }) {
  return (
    <div className="connection-status">
      <span className="status-dot online" aria-hidden="true" />
      <span>{status}</span>
    </div>
  );
}

export default ConnectionStatus;
