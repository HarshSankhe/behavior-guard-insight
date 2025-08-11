const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'analyst', 'user'],
    default: 'user'
  },
  consent: {
    type: Boolean,
    default: false,
    required: true
  },
  profile: {
    typicalTypingSpeed: { type: Number, default: 0 }, // WPM
    avgMouseSpeed: { type: Number, default: 0 }, // m/s
    networkLatencyRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 }
    },
    deviceFingerprint: { type: String, default: '' },
    behaviorScore: { type: Number, default: 50 }
  },
  settings: {
    sensitivity: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },
    realTimeMonitoring: { type: Boolean, default: true },
    alertNotifications: { type: Boolean, default: true },
    anomalyDetection: { type: Boolean, default: true }
  },
  lastLogin: { type: Date, default: null },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);