const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['keystroke', 'mouse_move', 'mouse_click', 'app_switch', 'network_latency', 'idle'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  // Aggregated data only - no raw keystrokes or sensitive content
  data: {
    // For keystroke events
    holdTime: Number, // ms between keydown and keyup
    flightTime: Number, // ms between successive keystrokes
    typingSpeed: Number, // instantaneous WPM
    
    // For mouse events  
    mouseSpeed: Number, // pixels/second
    acceleration: Number,
    movementPattern: String, // hashed pattern identifier
    
    // For app events
    appNameHash: String, // hashed app name for privacy
    focusTime: Number, // ms spent in app
    
    // For network events
    latency: Number, // ms
    packetLoss: Number, // percentage
    
    // General
    count: { type: Number, default: 1 }
  }
}, {
  timestamps: true
});

// Indexes for performance
eventSchema.index({ userId: 1, sessionId: 1, timestamp: -1 });
eventSchema.index({ sessionId: 1, timestamp: -1 });
eventSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Event', eventSchema);