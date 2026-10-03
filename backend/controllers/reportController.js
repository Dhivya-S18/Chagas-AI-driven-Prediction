import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import Alert from '../models/Alert.js';
import Analysis from '../models/Analysis.js';
import ECGRecording from '../models/ECGRecording.js';
import Report from '../models/Report.js';
import User from '../models/User.js';

const unavailable = (res) =>
  res.status(503).json({ message: 'Reports are unavailable while MongoDB is disconnected.' });

const parseDate = (value, boundary, fallback) => {
  const date = value || fallback;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const error = new Error('Report dates must use YYYY-MM-DD format.');
    error.statusCode = 400;
    throw error;
  }

  const result = new Date(`${date}T${boundary}Z`);
  if (!Number.isFinite(result.getTime()) || result.toISOString().slice(0, 10) !== date) {
    const error = new Error('Report date is invalid.');
    error.statusCode = 400;
    throw error;
  }
  return result;
};

export const getReports = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) return unavailable(res);
    const reports = await Report.find({ userId: req.user.userId }).sort({ generatedAt: -1 });
    return res.status(200).json(reports);
  } catch (error) {
    return next(error);
  }
};

export const getReportById = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) return unavailable(res);
    const report = await Report.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!report) return res.status(404).json({ message: 'Report not found.' });
    return res.status(200).json(report);
  } catch (error) {
    return next(error);
  }
};

export const createReport = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) return unavailable(res);

    const fallbackDate = new Date().toISOString().slice(0, 10);
    const periodStart = parseDate(req.body.startDate, '00:00:00.000', fallbackDate);
    const periodEnd = parseDate(req.body.endDate, '23:59:59.999', fallbackDate);
    if (periodStart > periodEnd) {
      return res.status(400).json({ message: 'Report start date must be on or before its end date.' });
    }

    const user = await User.findById(req.user.userId).select('name age gender');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const userId = req.user.userId;
    const [recordings, analyses, alerts] = await Promise.all([
      ECGRecording.find({ userId, recordedAt: { $gte: periodStart, $lte: periodEnd } }).sort({ recordedAt: 1 }),
      Analysis.find({ userId, analyzedAt: { $gte: periodStart, $lte: periodEnd } }).sort({ analyzedAt: 1 }),
      Alert.find({ userId, timestamp: { $gte: periodStart, $lte: periodEnd } }).sort({ timestamp: 1 }),
    ]);

    const report = await Report.create({
      userId,
      periodStart,
      periodEnd,
      userName: user.name,
      userAge: user.age ?? null,
      userGender: user.gender || 'Not provided',
      recordingCount: recordings.length,
      monitoringDurationSeconds: recordings.reduce((total, record) => total + (record.duration || 0), 0),
      dataSources: [...new Set(recordings.map((record) => record.source).filter(Boolean))],
      samplingRates: [...new Set(recordings.map((record) => record.samplingRate).filter(Boolean))],
      signalQualities: [...new Set(recordings.map((record) => record.signalQuality).filter(Boolean))],
      analysisResults: analyses.map((analysis) => ({
        analyzedAt: analysis.analyzedAt,
        status: analysis.status,
        prediction: analysis.prediction,
        predictionReason: analysis.predictionReason,
        probability: analysis.probability,
        target: analysis.target,
        source: analysis.source,
      })),
      alertDetails: alerts.map((alert) => ({
        timestamp: alert.timestamp,
        alertType: alert.alertType,
        message: alert.message,
        status: alert.status,
      })),
    });

    return res.status(201).json(report);
  } catch (error) {
    return next(error);
  }
};

export const downloadReport = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) return unavailable(res);
    const report = await Report.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!report) return res.status(404).json({ message: 'Report not found.' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="chagas-monitoring-report-${report.id}.pdf"`);
    const pdf = new PDFDocument({ margin: 54 });
    pdf.on('error', next);
    pdf.pipe(res);

    pdf.fontSize(20).text('Chagas AI Monitoring Report');
    pdf.moveDown().fontSize(14).text('User Information');
    pdf.fontSize(11).text(`Name: ${report.userName}`);
    pdf.text(`Age: ${report.userAge ?? 'Not provided'}`);
    pdf.text(`Gender: ${report.userGender}`);

    pdf.moveDown().fontSize(14).text('Monitoring Period');
    pdf.fontSize(11).text(`Start: ${report.periodStart.toISOString()}`);
    pdf.text(`End: ${report.periodEnd.toISOString()}`);
    pdf.text(`Report generated: ${report.generatedAt.toISOString()}`);

    pdf.moveDown().fontSize(14).text('ECG / Monitoring Summary');
    pdf.fontSize(11).text(`Recordings: ${report.recordingCount}`);
    pdf.text(`Monitoring duration: ${report.monitoringDurationSeconds} seconds`);
    pdf.text(`Data sources: ${report.dataSources.join(', ') || 'No recordings available'}`);
    pdf.text(`Sampling rates: ${report.samplingRates.map((rate) => `${rate} Hz`).join(', ') || 'Unavailable'}`);
    pdf.text(`Signal quality values: ${report.signalQualities.join(', ') || 'Unavailable'}`);

    pdf.moveDown().fontSize(14).text('AI Analysis');
    const availableResults = report.analysisResults.filter((result) =>
      result.prediction !== null && result.prediction !== undefined
      || Number.isFinite(result.probability),
    );
    if (availableResults.length === 0) {
      pdf.fontSize(11).text('AI analysis pending.');
    } else {
      for (const result of availableResults) {
        const decision = result.prediction === null || result.prediction === undefined
          ? result.predictionReason || 'No class decision configured.'
          : `Class value returned: ${result.prediction}.`;
        const summary = `${decision} Model-returned probability: ${result.probability ?? 'Unavailable'}; target: ${result.target || 'Unavailable'}.`;
        pdf.fontSize(11).text(`${new Date(result.analyzedAt).toISOString()} - ${summary}`);
      }
    }

    pdf.moveDown().fontSize(14).text('Alerts');
    if (report.alertDetails.length === 0) {
      pdf.fontSize(11).text('No alerts recorded during the selected period.');
    } else {
      pdf.fontSize(10).text('Monitoring alerts are not confirmed medical diagnoses.');
      for (const alert of report.alertDetails) {
        pdf.fontSize(11).text(`${new Date(alert.timestamp).toISOString()} - ${alert.alertType}: ${alert.message} (${alert.status})`);
      }
    }

    pdf.end();
  } catch (error) {
    return next(error);
  }
};
