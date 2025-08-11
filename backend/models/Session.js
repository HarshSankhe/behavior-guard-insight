const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  riskScore: {
    current: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    average: { type: Number, default: 0 }
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    deviceFingerprint: String,
    screenResolution: String,
    timezone: String
  },
  eventCount: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
sessionSchema.index({ userId: 1, startTime: -1 });
sessionSchema.index({ sessionId: 1 });
sessionSchema.index({ isActive: 1, lastActivity: -1 });

module.exports = mongoose.model('Session', sessionSchema);