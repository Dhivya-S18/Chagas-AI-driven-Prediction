import mongoose from 'mongoose';
import Analysis from '../models/Analysis.js';
import ECGRecording from '../models/ECGRecording.js';
import { MLServiceError, predict } from '../services/mlService.js';

export const getAnalyses = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Analysis data is unavailable while MongoDB is disconnected.' });
    }

    const analyses = await Analysis.find({ userId: req.user.userId }).sort({ analyzedAt: -1 });
    return res.status(200).json(analyses);
  } catch (error) {
    return next(error);
  }
};

export const getAnalysisById = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Analysis data is unavailable while MongoDB is disconnected.' });
    }

    const analysis = await Analysis.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }

    return res.status(200).json(analysis);
  } catch (error) {
    return next(error);
  }
};

export const createAnalysis = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Analysis is unavailable while MongoDB is disconnected.' });
    }

    const { recordingId } = req.body;
    if (typeof recordingId !== 'string' || !mongoose.isValidObjectId(recordingId)) {
      return res.status(400).json({ message: 'A valid recordingId is required.' });
    }

    const recording = await ECGRecording.findOne({
      _id: recordingId,
      userId: req.user.userId,
    }).select('+featureSequence');

    if (!recording) {
      return res.status(404).json({ message: 'ECG recording not found.' });
    }
    if (recording.source === 'DEMO') {
      return res.status(409).json({ message: 'DEMO ECG is for visualization only and cannot be sent for ML analysis.' });
    }
    if (!Array.isArray(recording.featureSequence)) {
      return res.status(409).json({ message: 'Valid ECG feature sequence required. ECG feature extraction is pending for this recording.' });
    }

    const result = await predict(recording.featureSequence);
    if (
      !result.prediction
      || !Object.hasOwn(result.prediction, 'class')
      || typeof result.probability !== 'number'
      || !Number.isFinite(result.probability)
      || typeof result.target !== 'string'
    ) {
      throw new MLServiceError('ML service returned an invalid prediction result.', 502);
    }

    const analysis = await Analysis.create({
      userId: req.user.userId,
      recordingId: String(recording._id),
      analyzedAt: new Date(),
      prediction: result.prediction.class,
      predictionReason: typeof result.prediction.reason === 'string' ? result.prediction.reason : null,
      probability: result.probability,
      target: result.target,
      source: 'ML_SERVICE',
      status: result.prediction.class === null ? 'NO_CLASS_DECISION' : 'CLASS_RETURNED',
    });

    return res.status(201).json(analysis);
  } catch (error) {
    return next(error);
  }
};
