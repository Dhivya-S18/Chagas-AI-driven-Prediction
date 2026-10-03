function HistoryTable({ rows = [] }) {
  return (
    <div className="table-card">
      <div className="section-header">
        <h3>Recent Measurements</h3>
        <span className="tag muted">Backend records</span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date/Time</th>
              <th>Heart Rate</th>
              <th>Signal Quality</th>
              <th>Source</th>
              <th>Monitoring Duration</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">No ECG records found.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row._id || `${row.date}-${row.time}`}>
                  <td>{new Date(row.recordedAt).toLocaleString()}</td>
                  <td>{Number.isFinite(row.heartRate) && row.heartRate > 0 ? `${row.heartRate} BPM` : 'Unavailable'}</td>
                  <td>{row.signalQuality || 'Unavailable'}</td>
                  <td>{row.source || 'Unavailable'}</td>
                  <td>{Number.isFinite(row.duration) && row.duration > 0 ? `${row.duration} sec` : 'Unavailable'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HistoryTable;
