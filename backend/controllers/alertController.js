import mongoose from 'mongoose';
import Alert from '../models/Alert.js';

export const getAlerts = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Alerts are unavailable while MongoDB is disconnected.' });
    }

    const alerts = await Alert.find({ userId: req.user.userId }).sort({ timestamp: -1 });
    return res.status(200).json(alerts);
  } catch (error) {
    return next(error);
  }
};