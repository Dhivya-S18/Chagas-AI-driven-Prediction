import mongoose from 'mongoose';

const ecgRecordingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
    samples: {
      type: [Number],
      default: [],
    },
    featureSequence: {
      type: [[Number]],
      select: false,
    },
    samplingRate: {
      type: Number,
      default: 250,
    },
    duration: {
      type: Number,
      default: 0,
    },
   heartRate: {
  type: Number,
  default: null,
},

signalQuality: {
  type: String,
  default: 'UNASSESSED',
},
    source: {
      type: String,
      enum: ['DEMO', 'ESP32'],
      default: 'DEMO',
    },
  },
  {
    timestamps: false,
  },
);

const ECGRecording = mongoose.model('ECGRecording', ecgRecordingSchema);

export default ECGRecording;
