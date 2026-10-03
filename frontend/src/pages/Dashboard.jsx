import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HistoryTable from '../components/HistoryTable';
import PredictionCard from '../components/PredictionCard';
import StatCard from '../components/StatCard';
import { getAlerts, getAnalyses, getApiErrorMessage, getBackendHealth, getECGRecords } from '../services/api';

function Dashboard() {
  const [monitoring, setMonitoring] = useState({ recordings: [], analyses: [], alerts: [], health: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCurrent = true;
    Promise.all([getECGRecords(), getAnalyses(), getAlerts(), getBackendHealth()])
      .then(([recordings, analyses, alerts, health]) => {
        if (isCurrent) setMonitoring({ recordings, analyses, alerts, health });
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
  const mlStatus = monitoring.health?.ml?.status === 'available'
    ? 'Available'
    : monitoring.health?.ml?.status === 'not_ready'
      ? 'Not ready'
      : monitoring.health?.ml?.status === 'timeout'
        ? 'Timed out'
        : loading ? 'Checking...' : 'Unavailable';
  const analysisSummary = latestAnalysis
    ? latestAnalysis.prediction === null || latestAnalysis.prediction === undefined
      ? `${latestAnalysis.predictionReason || 'No class decision configured.'} Model-returned probability: ${latestAnalysis.probability ?? 'Unavailable'}`
      : `Class value returned: ${latestAnalysis.prediction}`
    : 'No ML results available.';
  const backendStatus = monitoring.health?.backend || (loading ? 'Checking...' : 'Unavailable');
  const databaseStatus = monitoring.health?.mongodb || (loading ? 'Checking...' : 'Unavailable');

  return (
    <div className="dashboard-page">
      <div className="stats-grid">
        <StatCard label="Monitoring Status" value="DEMO only" hint="Waveform simulation is available in Live Monitor" accent="teal" />
        <StatCard label="Backend" value={backendStatus} hint="Express API" accent="blue" />
        <StatCard label="MongoDB" value={databaseStatus} hint="Database connection" accent="green" />
        <StatCard label="Latest ECG" value={latest?.source || 'No stored recording'} hint={latest ? new Date(latest.recordedAt).toLocaleString() : 'Monitor demo is not saved'} accent="blue" />
        <StatCard label="Heart Rate" value={heartRate} hint={latest?.source === 'DEMO' ? 'DEMO record' : 'Backend recording'} accent="green" />
        <StatCard label="Signal Quality" value={latest?.signalQuality || 'Unavailable'} hint={latest?.source === 'DEMO' ? 'DEMO record' : 'Backend recording'} accent="teal" />
        <StatCard label="ML Service" value={mlStatus} hint="Status verified through backend" accent="amber" />
      </div>

      <div className="page-grid two-column">
        <PredictionCard
          title="Latest AI Analysis"
          status={latestAnalysis?.status || 'ECG feature extraction pending'}
          extra={latestAnalysis ? analysisSummary : 'No AI analysis available. Valid ECG feature sequence required.'}
        />
        <div className="panel">
          <div className="section-header"><h3>Latest Alert</h3></div>
          <p className="card-note">{latestAlert ? latestAlert.message : 'No AI alerts available.'}</p>
        </div>
      </div>

      <div className="actions-panel">
        <Link className="primary-button" to="/monitor">Open Live Monitor</Link>
        <Link className="secondary-button" to="/reports">Generate Report</Link>
      </div>

      {loading ? <p className="card-note">Loading monitoring data...</p> : null}
      {error ? <p className="card-note" role="alert">{error}</p> : null}
      {!loading && !error ? <HistoryTable rows={monitoring.recordings.slice(0, 4)} /> : null}
    </div>
  );
}

export default Dashboard;
