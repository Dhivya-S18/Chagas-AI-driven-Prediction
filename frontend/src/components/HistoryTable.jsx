function HistoryTable({ rows = [] }) {
  return (
    <div className="table-card">
      <div className="section-header">
        <h3>Recent recordings</h3>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Heart rate</th>
              <th>Signal</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty-state">No recordings yet.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row._id || `${row.date}-${row.time}`}>
                  <td>{new Date(row.recordedAt).toLocaleString()}</td>
                  <td>{Number.isFinite(row.heartRate) && row.heartRate > 0 ? `${row.heartRate} BPM` : 'Unavailable'}</td>
                  <td>{row.signalQuality || 'Not yet assessed'}</td>
                  <td>{row.source || 'Unavailable'}</td>
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
