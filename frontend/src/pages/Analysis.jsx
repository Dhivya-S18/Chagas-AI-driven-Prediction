import { useEffect, useState } from 'react';

import {
  createAnalysis,
  getAnalyses,
  getApiErrorMessage,
  getBackendHealth,
  getECGMonitoringStatus,
  getECGRecords,
} from '../services/api';

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
   * Load the monitoring status repeatedly.
   *
   * This is important because the 10 × 26 feature sequence
   * is created only after 10 ECG windows are received.
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

    const interval = setInterval(
      loadMonitoringStatus,
      1000,
    );

    return () => {
      isCurrent = false;
      clearInterval(interval);
    };
  }, []);

  /*
   * Load recordings, analyses and ML health independently.
   *
   * Do not use Promise.all() here because one failed request
   * should not prevent the other successful requests from
   * appearing in the UI.
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

      /*
       * ECG recordings
       */
      if (
        recordingsResult.status === 'fulfilled'
      ) {
        setRecordings(recordingsResult.value);
      } else {
        console.error(
          'Unable to load ECG recordings:',
          recordingsResult.reason,
        );
      }

      /*
       * Analysis history
       */
      if (
        analysesResult.status === 'fulfilled'
      ) {
        setAnalyses(analysesResult.value);
      } else {
        console.error(
          'Unable to load analysis history:',
          analysesResult.reason,
        );

        setError(
          getApiErrorMessage(
            analysesResult.reason,
            'Unable to load analysis history.',
          ),
        );
      }

      /*
       * ML service status
       */
      if (
        healthResult.status === 'fulfilled'
      ) {
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

    /*
     * Refresh saved analyses and recordings periodically.
     * This allows a newly completed ML analysis to appear
     * without manually refreshing the page.
     */
    const interval = setInterval(
      async () => {
        try {
          const [newRecordings, newAnalyses] =
            await Promise.all([
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
      },
      3000,
    );

    return () => {
      isCurrent = false;
      clearInterval(interval);
    };
  }, []);

  const handleAnalyze = async (recordingId) => {
    setWorkingId(recordingId);
    setActionError('');

    try {
      const result =
        await createAnalysis(recordingId);

      setAnalyses((existing) => [
        result,
        ...existing,
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

  const lastResult =
    monitorStatus?.lastResult;

  const featureNames =
    lastResult?.featureNames || [];

  const featureSequence =
    lastResult?.sequence || [];

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

  return (
    <div className="history-page">

      {/* =====================================================
          AI ANALYSIS STATUS
      ===================================================== */}

      <section className="panel">
        <div className="section-header">
          <h3>AI Analysis</h3>

          <span
            className={`tag ${
              mlStatus === 'available'
                ? 'success'
                : mlStatus === 'checking'
                  ? 'warning'
                  : 'warning'
            }`}
          >
            {mlStatus === 'available'
              ? 'ML Service Available'
              : mlStatus === 'checking'
                ? 'Checking ML Service'
                : 'ML Service Unavailable'}
          </span>
        </div>

        <p className="card-note">
          Real ECG data from the ESP32 is used for
          feature extraction. DEMO ECG is not used
          for ML analysis.
        </p>

        {mlStatus === 'available' ? (
          <p
            className="card-note"
            role="status"
          >
            ML service is available and ready
            for analysis.
          </p>
        ) : null}

        {mlStatus === 'unavailable' ? (
          <p
            className="card-note"
            role="status"
          >
            ML service status could not be
            verified from the frontend.
          </p>
        ) : null}

        {actionError ? (
          <p
            className="card-note"
            role="alert"
          >
            {actionError}
          </p>
        ) : null}
      </section>

      {/* =====================================================
          CURRENT ECG FEATURE EXTRACTION
      ===================================================== */}

      <section className="panel">
        <div className="section-header">
          <h3>
            Current ECG Feature Extraction
          </h3>

          <span
            className={`tag ${
              featureSequenceReady
                ? 'success'
                : 'warning'
            }`}
          >
            {featureSequenceReady
              ? '10 × 26 READY'
              : 'Waiting for 10 × 26'}
          </span>
        </div>

        {!monitorStatus?.monitoring &&
        !featureSequenceReady ? (
          <p className="card-note">
            Start ECG monitoring from the Live
            Monitor page.
          </p>
        ) : null}

        {monitorStatus?.monitoring &&
        !featureSequenceReady ? (
          <p className="card-note">
            ECG monitoring is running. Waiting
            for 10 complete ECG windows before
            ML analysis.
          </p>
        ) : null}

        {featureSequenceReady ? (
          <>
            <p className="card-note">
              The real ESP32 ECG signal has
              produced a valid 10 × 26 feature
              sequence.
            </p>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Window</th>

                    {featureNames.map(
                      (name) => (
                        <th key={name}>
                          {name}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody>
                  {featureSequence.map(
                    (row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td>
                          Window{' '}
                          {rowIndex + 1}
                        </td>

                        {row.map(
                          (
                            value,
                            columnIndex,
                          ) => (
                            <td
                              key={
                                columnIndex
                              }
                            >
                              {Number.isFinite(
                                value,
                              )
                                ? Number(
                                    value,
                                  ).toFixed(
                                    4,
                                  )
                                : 'Invalid'}
                            </td>
                          ),
                        )}
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </section>

      {/* =====================================================
          ELIGIBLE RECORDINGS
      ===================================================== */}

      <section className="table-card">
        <div className="section-header">
          <h3>Eligible Recordings</h3>
        </div>

        {loading ? (
          <p className="card-note">
            Loading ECG recordings...
          </p>
        ) : null}

        {!loading &&
        !error &&
        recordings.length === 0 ? (
          <p className="empty-state">
            No ECG recordings available.
          </p>
        ) : null}

        {!loading &&
        !error &&
        recordings.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Recorded</th>
                  <th>Source</th>
                  <th>
                    Feature Sequence
                  </th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {recordings.map(
                  (recording) => {
                    const demo =
                      recording.source ===
                      'DEMO';

                    const hasFeatures =
                      recording.mlFeatureSequenceAvailable ===
                      true;

                    const canAnalyze =
                      !demo &&
                      hasFeatures &&
                      mlStatus ===
                        'available';

                    return (
                      <tr
                        key={
                          recording._id
                        }
                      >
                        <td>
                          {new Date(
                            recording.recordedAt,
                          ).toLocaleString()}
                        </td>

                        <td>
                          {recording.source ||
                            'Unavailable'}
                        </td>

                        <td>
                          {demo
                            ? 'DEMO ECG cannot be analyzed'
                            : hasFeatures
                              ? '10 × 26 sequence available'
                              : 'Valid ECG feature sequence required'}
                        </td>

                        <td>
                          <button
                            type="button"
                            className="link-button"
                            onClick={() =>
                              handleAnalyze(
                                recording._id,
                              )
                            }
                            disabled={
                              !canAnalyze ||
                              workingId ===
                                recording._id
                            }
                          >
                            {workingId ===
                            recording._id
                              ? 'Analyzing...'
                              : canAnalyze
                                ? 'Analyze'
                                : 'Unavailable'}
                          </button>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {/* =====================================================
          ANALYSIS HISTORY
      ===================================================== */}

      <section className="table-card">
        <div className="section-header">
          <h3>Analysis History</h3>
        </div>

        {error ? (
          <p
            className="card-note"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {!loading &&
        !error &&
        analyses.length === 0 ? (
          <p className="empty-state">
            No AI analysis available yet.
          </p>
        ) : null}

        {!loading &&
        !error &&
        analyses.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date/Time</th>
                  <th>Status</th>
                  <th>Model Output</th>
                  <th>Decision Reason</th>
                  <th>
                    Model Score
                  </th>
                  <th>Target</th>
                </tr>
              </thead>

              <tbody>
                {analyses.map(
                  (analysis) => {
                    const prediction =
                      analysis.prediction;

                    let modelOutput =
                      'Unavailable';

                    if (
                      prediction !==
                        null &&
                      prediction !==
                        undefined
                    ) {
                      if (
                        typeof prediction ===
                        'object'
                      ) {
                        if (
                          typeof prediction.prediction ===
                          'string'
                        ) {
                          modelOutput =
                            prediction.prediction;
                        } else if (
                          prediction.class !==
                            null &&
                          prediction.class !==
                            undefined
                        ) {
                          modelOutput =
                            String(
                              prediction.class,
                            );
                        } else if (
                          Number.isFinite(
                            prediction.score,
                          )
                        ) {
                          modelOutput =
                            String(
                              prediction.score,
                            );
                        }
                      } else {
                        modelOutput =
                          String(
                            prediction,
                          );
                      }
                    }

                    const modelScore =
                      prediction &&
                      typeof prediction ===
                        'object' &&
                      Number.isFinite(
                        prediction.score,
                      )
                        ? Number(
                            prediction.score,
                          ).toFixed(6)
                        : 'Unavailable';

                    return (
                      <tr
                        key={
                          analysis._id
                        }
                      >
                        <td>
                          {new Date(
                            analysis.analyzedAt,
                          ).toLocaleString()}
                        </td>

                        <td>
                          {analysis.status ||
                            'Unavailable'}
                        </td>

                        <td>
                          {modelOutput}
                        </td>

                        <td>
                          {analysis.predictionReason ||
                            'Unavailable'}
                        </td>

                        <td>
                          {modelScore}
                        </td>

                        <td>
                          {analysis.target ??
                            'Unavailable'}
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loading &&
        analyses.length > 0 ? (
          <p className="card-note">
            Model-returned values are shown
            without medical interpretation.
          </p>
        ) : null}
      </section>
    </div>
  );
}

export default Analysis;