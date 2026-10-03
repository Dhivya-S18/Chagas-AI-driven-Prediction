import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recordingId: {
      type: String,
      required: true,
      trim: true,
    },
    analyzedAt: {
      type: Date,
      default: Date.now,
    },
    features: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    prediction: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      nullable: true,
    },
    predictionReason: {
      type: String,
      default: null,
    },
    probability: {
      type: Number,
      default: null,
      nullable: true,
    },
    target: {
      type: String,
      default: null,
    },
    source: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      default: 'NOT_ANALYZED',
    },
  },
  {
    timestamps: false,
  },
);

const Analysis = mongoose.model('Analysis', analysisSchema);

export default Analysis;
