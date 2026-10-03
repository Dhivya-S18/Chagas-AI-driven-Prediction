import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    analysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Analysis',
      default: null,
    },
    alertType: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'REVIEWED', 'CLOSED'],
      default: 'OPEN',
    },
  },
  { timestamps: false },
);

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;