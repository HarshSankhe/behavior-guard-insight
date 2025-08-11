const mongoose = require('mongoose');

const riskLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  factors: {
    typingSpeed: { value: Number, deviation: String },
    mouseSpeed: { value: Number, deviation: String },
    latency: { value: Number, deviation: String },
    appUsage: { value: Number, deviation: String },
    overall: { confidence: Number, anomalies: [String] }
  },
  modelUsed: {
    type: String,
    required: true // 'global' or user-specific model ID
  },
  reconstructionError: {
    type: Number,
    required: true
  },
  eventCount: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for performance
riskLogSchema.index({ userId: 1, timestamp: -1 });
riskLogSchema.index({ sessionId: 1, timestamp: -1 });
riskLogSchema.index({ riskScore: -1, timestamp: -1 });

module.exports = mongoose.model('RiskLog', riskLogSchema);