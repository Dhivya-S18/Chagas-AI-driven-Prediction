import { useEffect, useState } from 'react';
import {
  getAlerts,
  getAnalyses,
  getApiErrorMessage,
  getECGRecords,
} from '../services/api';
import {
  formatRawModelScore,
  getModelOutputLabel,
  getRawModelScore,
} from '../utils/analysisPresentation';

function History() {
  const [history, setHistory] = useState({
    recordings: [],
    analyses: [],
    alerts: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCurrent = true;

    const loadHistory = async () => {
      setLoading(true);
      setError('');

      const results = await Promise.allSettled([
        getECGRecords(),
        getAnalyses(),
        getAlerts(),
      ]);

      if (!isCurrent) {
        return;
      }

      const [recordingsResult, analysesResult, alertsResult] =
        results;

      const nextHistory = {
        recordings: [],
        analyses: [],
        alerts: [],
      };

      const errors = [];

      if (recordingsResult.status === 'fulfilled') {
        nextHistory.recordings = recordingsResult.value;
      } else {
        console.error(
          'Unable to load ECG records:',
          recordingsResult.reason,
        );

        errors.push(
          getApiErrorMessage(
            recordingsResult.reason,
            'Unable to load ECG records.',
          ),
        );
      }

      if (analysesResult.status === 'fulfilled') {
        nextHistory.analyses = analysesResult.value;
      } else {
        console.error(
          'Unable to load analyses:',
          analysesResult.reason,
        );

        errors.push(
          getApiErrorMessage(
            analysesResult.reason,
            'Unable to load analysis history.',
          ),
        );
      }

      if (alertsResult.status === 'fulfilled') {
        nextHistory.alerts = alertsResult.value;
      } else {
        console.error(
          'Unable to load alerts:',
          alertsResult.reason,
        );

        errors.push(
          getApiErrorMessage(
            alertsResult.reason,
            'Unable to load alerts.',
          ),
        );
      }

      setHistory(nextHistory);

      if (errors.length > 0) {
        setError(errors.join(' '));
      }

      setLoading(false);
    };

    loadHistory();

    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <div className="history-page">
      {loading ? (
        <p className="card-note">
          Loading monitoring history...
        </p>
      ) : null}

      {error ? (
        <p className="card-note" role="alert">
          {error}
        </p>
      ) : null}

      {!loading ? (
        <>
          <section className="table-card">
            <div className="section-header">
              <h3>Recent measurements</h3>
            </div>

            {history.recordings.length === 0 ? (
              <p className="empty-state">
                No ECG monitoring records available.
              </p>
            ) : (
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
                    {history.recordings.map((recording) => (
                      <tr key={recording._id}>
                        <td>
                          {recording.recordedAt
                            ? new Date(
                                recording.recordedAt,
                              ).toLocaleString()
                            : 'Unavailable'}
                        </td>

                        <td>
                          {recording.heartRate !==
                            null &&
                          recording.heartRate !==
                            undefined
                            ? recording.heartRate
                            : 'Unavailable'}
                        </td>

                        <td>
                          {recording.signalQuality !==
                            null &&
                          recording.signalQuality !==
                            undefined
                            ? recording.signalQuality
                            : 'Unavailable'}
                        </td>

                        <td>
                          {recording.source ||
                            'Unavailable'}
                        </td>

                        <td>
                          {recording.duration !== null &&
                          recording.duration !==
                            undefined
                            ? recording.duration
                            : 'Unavailable'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="table-card">
            <div className="section-header">
              <h3>AI analysis</h3>
            </div>

            {history.analyses.length === 0 ? (
              <p className="empty-state">
                No AI analysis records available.
              </p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date/Time</th>
                      <th>Status</th>
                      <th>Model Output</th>
                      <th>Decision Reason</th>
                      <th>Model Score</th>
                      <th>Target</th>
                    </tr>
                  </thead>

                  <tbody>
                    {history.analyses.map((analysis) => {
                      const modelOutput =
                        getModelOutputLabel(analysis);
                      const modelScore =
                        formatRawModelScore(
                          getRawModelScore(analysis),
                        );

                      return (
                        <tr key={analysis._id}>
                          <td>
                            {analysis.analyzedAt
                              ? new Date(
                                  analysis.analyzedAt,
                                ).toLocaleString()
                              : 'Unavailable'}
                          </td>

                          <td>
                            {analysis.status ||
                              'Unavailable'}
                          </td>

                          <td>{modelOutput}</td>

                          <td>
                            {analysis.predictionReason ||
                              'Unavailable'}
                          </td>

                          <td>
                            <div>{modelScore}</div>
                            <div>Risk Score: Unavailable</div>
                          </td>

                          <td>
                            {analysis.target ??
                              'Unavailable'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {history.analyses.length > 0 ? (
              <p className="card-note">
                Model-returned values are shown
                without medical interpretation.
              </p>
            ) : null}
          </section>

          <section className="table-card">
            <div className="section-header">
              <h3>Alerts</h3>
            </div>

            {history.alerts.length === 0 ? (
              <p className="empty-state">
                No AI alerts available.
              </p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date/Time</th>
                      <th>Type</th>
                      <th>Message</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {history.alerts.map((alert) => (
                      <tr key={alert._id}>
                        <td>
                          {alert.timestamp
                            ? new Date(
                                alert.timestamp,
                              ).toLocaleString()
                            : 'Unavailable'}
                        </td>

                        <td>
                          {alert.alertType ||
                            'Unavailable'}
                        </td>

                        <td>
                          {alert.message ||
                            'Unavailable'}
                        </td>

                        <td>
                          {alert.status ||
                            'Unavailable'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

export default History;