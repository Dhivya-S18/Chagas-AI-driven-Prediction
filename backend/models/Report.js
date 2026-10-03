import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userAge: {
      type: Number,
      default: null,
    },
    userGender: {
      type: String,
      default: 'Not provided',
    },
    recordingCount: {
      type: Number,
      default: 0,
    },
    monitoringDurationSeconds: {
      type: Number,
      default: 0,
    },
    dataSources: {
      type: [String],
      default: [],
    },
    samplingRates: {
      type: [Number],
      default: [],
    },
    signalQualities: {
      type: [String],
      default: [],
    },
    analysisResults: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    alertDetails: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    status: {
      type: String,
      default: 'DRAFT',
    },
  },
  {
    timestamps: false,
  },
);

const Report = mongoose.model('Report', reportSchema);

export default Report;
