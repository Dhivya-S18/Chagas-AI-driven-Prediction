
import { useEffect, useState } from 'react';
import ECGChart from '../components/ECGChart';
import api from '../services/api';

function LiveMonitor() {
  const [monitoring, setMonitoring] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await api.get('/ecg/monitor/status');

      setStatus(response.data);
      setMonitoring(Boolean(response.data?.monitoring));
      setError('');
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
        'Unable to get ECG monitoring status.'
      );
    }
  };

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    fetchStatus();

    const interval = setInterval(() => {
      fetchStatus();
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/ecg/monitor/start');

      setStatus(response.data);
      setMonitoring(Boolean(response.data?.monitoring));
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
        'Unable to start ECG monitoring.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/ecg/monitor/stop');

      setStatus(response.data);
      setMonitoring(false);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
        'Unable to stop ECG monitoring.'
      );
    } finally {
      setLoading(false);
    }
  };

  const serialConnected = status?.serial?.connected ?? false;
  const recentSamples = status?.recentSamples ?? [];

  return (
    <div className="monitor-page">
      <div className="monitor-summary">
        <div className="info-card">
          <p className="feature-label">Monitoring</p>
          <h3>{monitoring ? 'Running' : 'Stopped'}</h3>
        </div>

        <div className="info-card">
          <p className="feature-label">Signal</p>
          <h3>DEMO ECG</h3>
        </div>

        <div className="info-card">
          <p className="feature-label">Connection</p>
          <h3>
            {serialConnected
              ? 'Hardware connected'
              : 'No hardware connected'}
          </h3>
        </div>
      </div>

      <div className="monitor-controls">
        <button
          type="button"
          className="primary-button"
          onClick={handleStart}
          disabled={loading || monitoring}
        >
          {loading ? 'Please wait...' : 'Start demo ECG'}
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={handleStop}
          disabled={loading || !monitoring}
        >
          Stop demo ECG
        </button>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <div className="info-card">
        <p className="feature-label">Current status</p>
        <h3>Simulation only</h3>
        <p>
          This live monitor shows a demo waveform for interface
          testing. No real ECG hardware is connected.
        </p>
      </div>

      <ECGChart
        series={recentSamples}
        title="DEMO ECG waveform"
      />
    </div>
  );
}

export default LiveMonitor;