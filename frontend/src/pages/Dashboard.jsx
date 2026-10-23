import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HistoryTable from '../components/HistoryTable';
import PredictionCard from '../components/PredictionCard';
import StatCard from '../components/StatCard';
import { getAlerts, getAnalyses, getApiErrorMessage, getECGRecords } from '../services/api';

function Dashboard() {
  const [monitoring, setMonitoring] = useState({ recordings: [], analyses: [], alerts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCurrent = true;
    Promise.all([getECGRecords(), getAnalyses(), getAlerts()])
      .then(([recordings, analyses, alerts]) => {
        if (isCurrent) setMonitoring({ recordings, analyses, alerts });
      })
      .catch((requestError) => {
        if (isCurrent) setError(getApiErrorMessage(requestError, 'Unable to load monitoring data.'));
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const latest = monitoring.recordings[0];
  const latestAnalysis = monitoring.analyses[0];
  const latestAlert = monitoring.alerts[0];
  const heartRate = Number.isFinite(latest?.heartRate) && latest.heartRate > 0
    ? `${latest.heartRate} BPM`
    : 'Unavailable';
  const analysisStatus = latestAnalysis
    ? latestAnalysis.status || 'ML Integration Pending'
    : 'ML Integration Pending';
  const alertText = latestAlert ? latestAlert.message : 'No recent alerts';

  return (
    <div className="dashboard-page">
      <div className="stats-grid">
        <StatCard label="Monitoring" value="DEMO ECG" hint={latest ? 'Waveform is available in Live Monitor' : 'No recorded signal yet'} accent="teal" />
        <StatCard label="Latest ECG" value={latest?.source || 'No recording'} hint={latest ? new Date(latest.recordedAt).toLocaleString() : 'No recorded ECG yet'} accent="blue" />
        <StatCard label="Heart rate" value={heartRate} hint={latest?.source ? `Source: ${latest.source}` : 'Available when a recording exists'} accent="green" />
        <StatCard label="AI status" value={analysisStatus} hint="Verified from the backend when available" accent="amber" />
      </div>

      <div className="page-grid two-column">
        <PredictionCard
          title="Latest AI analysis"
          status={analysisStatus}
          extra={latestAnalysis
            ? `Status: ${latestAnalysis.status || 'ML Integration Pending'}`
            : 'No verified ML result is available yet.'}
        />
        <div className="panel">
          <div className="section-header"><h3>Recent alert</h3></div>
          <p className="card-note">{alertText}</p>
        </div>
      </div>

      <div className="actions-panel">
        <Link className="primary-button" to="/monitor">Open monitor</Link>
        <Link className="secondary-button" to="/history">View history</Link>
        <Link className="secondary-button" to="/reports">Generate report</Link>
      </div>

      {loading ? <p className="card-note">Loading monitoring data...</p> : null}
      {error ? <p className="card-note" role="alert">{error}</p> : null}
      {!loading && !error ? <HistoryTable rows={monitoring.recordings.slice(0, 4)} /> : null}
    </div>
  );
}

export default Dashboard;
