import { useEffect, useState } from 'react';
import { createReport, downloadReport, getApiErrorMessage, getReports } from '../services/api';

const today = () => new Date().toISOString().slice(0, 10);

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let isCurrent = true;
    getReports()
      .then((data) => {
        if (isCurrent) setReports(data);
      })
      .catch((requestError) => {
        if (isCurrent) setError(getApiErrorMessage(requestError, 'Unable to load reports.'));
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const handleGenerateReport = async (event) => {
    event.preventDefault();
    setGenerating(true);
    setError('');
    setNotice('');

    try {
      const report = await createReport({ startDate, endDate });
      setReports((existing) => [report, ...existing]);
      setNotice('Report generated.');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to generate the report.'));
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = async (reportId) => {
    setDownloadingId(reportId);
    setError('');
    try {
      const pdf = await downloadReport(reportId);
      const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `monitoring-report-${reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to download the PDF report.'));
    } finally {
      setDownloadingId('');
    }
  };

  return (
    <div className="reports-page">
      <section className="panel">
        <div className="section-header"><h3>Generate New Report</h3></div>
        <form className="auth-form" onSubmit={handleGenerateReport}>
          <label>Start date<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required /></label>
          <label>End date<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} min={startDate} required /></label>
          <button type="submit" className="primary-button" disabled={generating}>
            {generating ? 'Generating...' : 'Generate PDF Report'}
          </button>
        </form>
        {notice ? <p className="card-note" role="status">{notice}</p> : null}
        {error ? <p className="card-note" role="alert">{error}</p> : null}
        <p className="card-note">Reports can be generated without an alert. AI analysis is reported as unavailable while ML integration is pending.</p>
      </section>

      <section className="table-card">
        <div className="section-header"><h3>Previous Reports</h3></div>
        {loading ? <p className="card-note">Loading reports...</p> : null}
        {!loading && !error && reports.length === 0 ? <p className="empty-state">No reports generated yet.</p> : null}
        {!loading && reports.length > 0 ? (
          <div className="table-wrap"><table>
            <thead><tr><th>Generated</th><th>Period</th><th>Recordings</th><th>Action</th></tr></thead>
            <tbody>{reports.map((report) => (
              <tr key={report._id}>
                <td>{new Date(report.generatedAt).toLocaleString()}</td>
                <td>{new Date(report.periodStart).toLocaleDateString()} - {new Date(report.periodEnd).toLocaleDateString()}</td>
                <td>{report.recordingCount}</td>
                <td><button type="button" className="link-button" onClick={() => handleDownloadReport(report._id)} disabled={downloadingId === report._id}>
                  {downloadingId === report._id ? 'Preparing...' : 'Download PDF'}
                </button></td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : null}
      </section>
    </div>
  );
}

export default Reports;
