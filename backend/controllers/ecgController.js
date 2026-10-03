import mongoose from 'mongoose';
import ECGRecording from '../models/ECGRecording.js';
import { ML_FEATURE_NAMES } from '../services/mlFeatureSchema.js';
import User from '../models/User.js';

import {
  startLiveECG,
  stopLiveECG,
  getLiveECGStatus,
} from '../services/ecg/liveECGService.js';

export const startECGMonitoring = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('age gender');

    if (!user) {
      return res.status(404).json({
        message: 'Authenticated user not found.',
      });
    }

    const status = startLiveECG({
      userId: req.user.userId,
      age: user.age,
      gender: user.gender,
    });

    return res.status(200).json(status);
  } catch (error) {
    return next(error);
  }
};

export const stopECGMonitoring = async (req, res, next) => {
  try {
    stopLiveECG();

    return res.status(200).json({
      monitoring: false,
      message: 'ECG monitoring stopped.',
    });
  } catch (error) {
    return next(error);
  }
};

export const getECGMonitoringStatus = async (req, res, next) => {
  try {
    const status = getLiveECGStatus();

    return res.status(200).json(status);
  } catch (error) {
    return next(error);
  }
};
export const getECGRecords = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message:
          'ECG data is unavailable while MongoDB is disconnected.',
      });
    }

    const recordings = await ECGRecording.find({
      userId: req.user.userId,
    })
      .select(
        '+featureSequence recordedAt duration heartRate signalQuality source',
      )
      .sort({ recordedAt: -1 })
      .lean();

    const safeRecordings = recordings.map((recording) => {
      const featureSequence = recording.featureSequence;

      const mlFeatureSequenceAvailable =
        Array.isArray(featureSequence) &&
        featureSequence.length === 10 &&
        featureSequence.every(
          (row) =>
            Array.isArray(row) &&
            row.length === ML_FEATURE_NAMES.length &&
            row.every(
              (value) =>
                typeof value === 'number' &&
                Number.isFinite(value),
            ),
        );

      return {
        _id: recording._id,
        recordedAt: recording.recordedAt,
        duration: recording.duration,
        heartRate: recording.heartRate,
        signalQuality: recording.signalQuality,
        source: recording.source,
        mlFeatureSequenceAvailable,
      };
    });

    return res.status(200).json(safeRecordings);
  } catch (error) {
    return next(error);
  }
};

export const getECGById = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'ECG data is unavailable while MongoDB is disconnected.' });
    }

    const recording = await ECGRecording.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!recording) {
      return res.status(404).json({ message: 'ECG recording not found' });
    }

    return res.status(200).json(recording);
  } catch (error) {
    return next(error);
  }
};
