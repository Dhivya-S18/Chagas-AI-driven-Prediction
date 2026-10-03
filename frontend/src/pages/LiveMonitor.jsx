
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
      setMonitoring(response.data.monitoring);
      setError('');
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
        'Unable to get ECG monitoring status.'
      );
    }
  };

  useEffect(() => {
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
      setMonitoring(response.data.monitoring);
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

  const sampleCount = status?.sampleCount ?? 0;
  const samplingRate = status?.samplingRate ?? 250;
  const windowSeconds = status?.windowSeconds ?? 10;
  const serialConnected = status?.serial?.connected ?? false;

  const recentSamples = status?.recentSamples ?? [];

  const lastWindow = status?.lastWindow;
  const lastResult = status?.lastResult;

  return (
    <div className="monitor-page">
      <div className="monitor-summary">
        <div className="info-card">
          <p className="feature-label">Monitoring status</p>
          <h3>{monitoring ? 'Running' : 'Stopped'}</h3>
        </div>

        <div className="info-card">
          <p className="feature-label">Data source</p>
          <h3>ESP32 ECG</h3>
        </div>

        <div className="info-card">
          <p className="feature-label">ESP32 status</p>
          <h3>
            {serialConnected ? 'Connected' : 'Not connected'}
          </h3>
        </div>

        <div className="info-card">
          <p className="feature-label">Sampling rate</p>
          <h3>{samplingRate} Hz</h3>
        </div>

        <div className="info-card">
          <p className="feature-label">Samples received</p>
          <h3>{sampleCount}</h3>
        </div>

        <div className="info-card">
          <p className="feature-label">Display samples</p>
          <h3>{recentSamples.length}</h3>
        </div>

        <div className="info-card">
          <p className="feature-label">Heart rate</p>
          <h3>Unavailable</h3>
        </div>

        <div className="info-card">
          <p className="feature-label">Signal quality</p>
          <h3>Pending</h3>
        </div>
      </div>

      <div className="monitor-controls">
        <button
          type="button"
          className="primary-button"
          onClick={handleStart}
          disabled={loading || monitoring}
        >
          {loading ? 'Please wait...' : 'Start Monitoring'}
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={handleStop}
          disabled={loading || !monitoring}
        >
          Stop Monitoring
        </button>

        <div className="duration-box">
          <span className="feature-label">
            Monitoring
          </span>

          <strong>
            {monitoring
              ? `${sampleCount} samples`
              : 'Stopped'}
          </strong>
        </div>
      </div>

      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}

      <div className="info-card">
        <p className="feature-label">
          Live ECG signal
        </p>

        <h3>
          {serialConnected
            ? 'ESP32 ECG signal connected'
            : 'Waiting for ESP32 connection'}
        </h3>

        <p>
          Samples received from the ESP32 are displayed below.
        </p>
      </div>

      <ECGChart
        series={recentSamples}
        title="Live ESP32 ECG"
      />

      {lastWindow && (
        <div className="info-card">
          <p className="feature-label">
            Last ECG window
          </p>

          <h3>
            {lastWindow.sampleCount} samples
          </h3>

          <p>
            Sampling rate: {lastWindow.samplingRate} Hz
          </p>

          <p>
            Received:{' '}
            {new Date(
              lastWindow.receivedAt
            ).toLocaleString()}
          </p>
        </div>
      )}

      {lastResult && (
        <div className="info-card">
          <p className="feature-label">
            AI analysis
          </p>

          {lastResult.ready ? (
            <>
              <h3>Analysis completed</h3>

              <p>
                Feature sequence:{' '}
                {lastResult.sequenceLength} ×{' '}
                {lastResult.featureCount}
              </p>

              <p>
                Recording ID: {lastResult.recordingId}
              </p>

              <p>
                Analysis ID: {lastResult.analysisId}
              </p>
            </>
          ) : (
            <>
              <h3>Analysis pending</h3>

              <p>
                {lastResult.reason}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default LiveMonitor;
