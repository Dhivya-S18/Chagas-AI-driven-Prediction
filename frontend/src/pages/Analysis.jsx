
import { useEffect, useState } from 'react';

import {
  createAnalysis,
  getAnalyses,
  getApiErrorMessage,
  getBackendHealth,
  getECGMonitoringStatus,
  getECGRecords,
} from '../services/api';

import {
  getAnalysisClassLabel,
  getLatestEligibleRecording,
} from '../utils/analysisPresentation';

function Analysis() {
  const [recordings, setRecordings] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [mlStatus, setMlStatus] = useState('checking');
  const [monitorStatus, setMonitorStatus] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [workingId, setWorkingId] = useState('');

  /*
   * Refresh ECG monitoring status.
   * The feature extraction sequence remains unchanged.
   */
  useEffect(() => {
    let isCurrent = true;

    const loadMonitoringStatus = async () => {
      try {
        const status = await getECGMonitoringStatus();

        if (isCurrent) {
          setMonitorStatus(status);
        }
      } catch (requestError) {
        if (isCurrent) {
          console.error(
            'Unable to load ECG monitoring status:',
            requestError,
          );
        }
      }
    };

    loadMonitoringStatus();

    const interval = setInterval(loadMonitoringStatus, 1000);

    return () => {
      isCurrent = false;
      clearInterval(interval);
    };
  }, []);

  /*
   * Load recordings, saved analyses and ML status.
   * Refresh saved data periodically so new predictions appear.
   */
  useEffect(() => {
    let isCurrent = true;

    const loadData = async () => {
      setLoading(true);
      setError('');

      const results = await Promise.allSettled([
        getECGRecords(),
        getAnalyses(),
        getBackendHealth(),
      ]);

      if (!isCurrent) {
        return;
      }

      const [
        recordingsResult,
        analysesResult,
        healthResult,
      ] = results;

      if (recordingsResult.status === 'fulfilled') {
        setRecordings(recordingsResult.value);
      } else {
        console.error(
          'Unable to load ECG recordings:',
          recordingsResult.reason,
        );

        setError(
          getApiErrorMessage(
            recordingsResult.reason,
            'Unable to load ECG recordings.',
          ),
        );
      }

      if (analysesResult.status === 'fulfilled') {
        setAnalyses(analysesResult.value);
      } else {
        console.error(
          'Unable to load saved analyses:',
          analysesResult.reason,
        );

        setError(
          getApiErrorMessage(
            analysesResult.reason,
            'Unable to load saved analyses.',
          ),
        );
      }

      if (healthResult.status === 'fulfilled') {
        const health = healthResult.value;

        setMlStatus(
          health?.ml?.status ||
            health?.mlStatus ||
            'unavailable',
        );
      } else {
        console.error(
          'Unable to load backend health:',
          healthResult.reason,
        );

        setMlStatus('unavailable');
      }

      setLoading(false);
    };

    loadData();

    const interval = setInterval(async () => {
      try {
        const [newRecordings, newAnalyses] = await Promise.all([
          getECGRecords(),
          getAnalyses(),
        ]);

        if (isCurrent) {
          setRecordings(newRecordings);
          setAnalyses(newAnalyses);
        }
      } catch (requestError) {
        console.error(
          'Unable to refresh analysis data:',
          requestError,
        );
      }
    }, 3000);

    return () => {
      isCurrent = false;
      clearInterval(interval);
    };
  }, []);

  const handleAnalyze = async (recordingId) => {
    setWorkingId(recordingId);
    setActionError('');

    try {
      const result = await createAnalysis(recordingId);

      setAnalyses((existing) => [
        result,
        ...existing.filter(
          (analysis) =>
            String(analysis._id) !== String(result?._id),
        ),
      ]);
    } catch (requestError) {
      setActionError(
        getApiErrorMessage(
          requestError,
          'Unable to request ML analysis.',
        ),
      );
    } finally {
      setWorkingId('');
    }
  };

  const lastResult = monitorStatus?.lastResult;

  const featureNames = lastResult?.featureNames || [];
  const featureSequence = lastResult?.sequence || [];

  const featureSequenceReady =
    lastResult?.ready === true &&
    featureSequence.length === 10 &&
    featureSequence.every(
      (row) =>
        Array.isArray(row) &&
        row.length === 26 &&
        row.every(
          (value) =>
            typeof value === 'number' &&
            Number.isFinite(value),
        ),
    );

  const latestEligibleRecording =
    getLatestEligibleRecording(recordings);

  const latestRecordingAnalysis = latestEligibleRecording
    ? analyses.find(
        (analysis) =>
          String(analysis.recordingId) ===
          String(latestEligibleRecording._id),
      )
    : null;

  return (
    <div className="history-page">
      {/* LATEST ELIGIBLE RECORDING */}

      <section className="table-card">
        <div className="section-header">
          <h3>Latest Eligible Recording</h3>
        </div>

        {error ? (
          <p className="card-note" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="card-note">
            Loading ECG recordings...
          </p>
        ) : null}

        {!loading && !error && !latestEligibleRecording ? (
          <p className="empty-state">
            No eligible ECG recording available.
          </p>
        ) : null}

        {!loading && latestEligibleRecording ? (
<div className="table-wrap">
  <table style={{ width: 'auto', tableLayout: 'auto' }}>
    <thead>
      <tr>
        <th style={{ paddingRight: '16px' }}>
          Recording Date &amp; Time
        </th>
        <th>
          Classification
        </th>
      </tr>
    </thead>

    <tbody>
      <tr key={latestEligibleRecording._id}>
        <td style={{ paddingRight: '16px' }}>
          {latestEligibleRecording.recordedAt
            ? new Date(
                latestEligibleRecording.recordedAt,
              ).toLocaleString()
            : 'Timestamp unavailable'}
        </td>

        <td>
          {latestRecordingAnalysis
            ? getAnalysisClassLabel(latestRecordingAnalysis)
            : 'Analysis pending'}
        </td>
      </tr>
    </tbody>
  </table>
</div>
        ) : null}

        {actionError ? (
          <p className="card-note" role="alert">
            {actionError}
          </p>
        ) : null}
      </section>

      {/* CURRENT ECG FEATURE EXTRACTION */}

      <section className="panel">
        <div className="section-header">
          <h3>Current ECG Feature Extraction</h3>

          <span
            className={`tag ${
              featureSequenceReady ? 'success' : 'warning'
            }`}
          >
            {featureSequenceReady
              ? '10 × 26 READY'
              : 'Waiting for 10 × 26'}
          </span>
        </div>

        {!monitorStatus?.monitoring && !featureSequenceReady ? (
          <p className="card-note">
            Start ECG monitoring from the Live Monitor page.
          </p>
        ) : null}

        {monitorStatus?.monitoring && !featureSequenceReady ? (
          <p className="card-note">
            ECG monitoring is running. Waiting for 10 complete
            ECG windows before ML analysis.
          </p>
        ) : null}

        {featureSequenceReady ? (
          <>
            <p className="card-note">
              The real ESP32 ECG signal has produced a valid
              10 × 26 feature sequence.
            </p>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Window</th>

                    {featureNames.map((name) => (
                      <th key={name}>{name}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {featureSequence.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td>Window {rowIndex + 1}</td>

                      {row.map((value, columnIndex) => (
                        <td key={columnIndex}>
                          {Number.isFinite(value)
                            ? Number(value).toFixed(4)
                            : 'Invalid'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}

export default Analysis;