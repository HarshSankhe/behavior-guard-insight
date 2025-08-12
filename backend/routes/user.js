const express = require('express');
const User = require('../models/User');
const RiskLog = require('../models/RiskLog');
const Event = require('../models/Event');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/user/profile - Get user profile and behavioral metrics
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Calculate behavioral metrics from recent events
    const recentEvents = await Event.find({ 
      userId,
      timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });
    
    // Get latest risk assessment
    const latestRisk = await RiskLog.findOne({ userId })
      .sort({ timestamp: -1 });
    
    // Calculate metrics
    const keystrokeEvents = recentEvents.filter(e => e.type === 'keystroke');
    const mouseEvents = recentEvents.filter(e => e.type === 'mouse_move');
    const networkEvents = recentEvents.filter(e => e.type === 'network_latency');
    
    const avgTypingSpeed = keystrokeEvents.length > 0 
      ? keystrokeEvents.reduce((sum, e) => sum + (e.data.typingSpeed || 0), 0) / keystrokeEvents.length
      : user.profile.typicalTypingSpeed;
      
    const avgMouseSpeed = mouseEvents.length > 0
      ? mouseEvents.reduce((sum, e) => sum + (e.data.mouseSpeed || 0), 0) / mouseEvents.length
      : user.profile.avgMouseSpeed;
      
    const avgLatency = networkEvents.length > 0
      ? networkEvents.reduce((sum, e) => sum + (e.data.latency || 0), 0) / networkEvents.length
      : (user.profile.networkLatencyRange.min + user.profile.networkLatencyRange.max) / 2;
    
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      profile: {
        ...user.profile,
        currentMetrics: {
          typingSpeed: `${Math.round(avgTypingSpeed)} WPM`,
          mouseSpeed: `${avgMouseSpeed.toFixed(3)} m/s`,
          networkLatency: `${Math.round(avgLatency)} ms`,
          behaviorScore: user.profile.behaviorScore,
          riskScore: latestRisk?.riskScore || 0,
          lastAssessment: latestRisk?.timestamp || null
        }
      },
      settings: user.settings,
      statistics: {
        totalEvents: recentEvents.length,
        sessionsThisWeek: await Event.distinct('sessionId', {
          userId,
          timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }).then(sessions => sessions.length),
        avgRiskScore: latestRisk?.riskScore || 0
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// PUT /api/user/profile - Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { email, profile } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (email) user.email = email;
    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }
    
    await user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;