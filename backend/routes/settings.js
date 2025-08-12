const express = require('express');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/settings - Get user settings
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await User.findById(userId).select('settings');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      settings: user.settings
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings - Update user settings
router.put('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sensitivity, realTimeMonitoring, alertNotifications, anomalyDetection } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update settings
    if (sensitivity !== undefined) user.settings.sensitivity = sensitivity;
    if (realTimeMonitoring !== undefined) user.settings.realTimeMonitoring = realTimeMonitoring;
    if (alertNotifications !== undefined) user.settings.alertNotifications = alertNotifications;
    if (anomalyDetection !== undefined) user.settings.anomalyDetection = anomalyDetection;
    
    await user.save();
    
    res.json({
      message: 'Settings updated successfully',
      settings: user.settings
    });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// GET /api/settings/export - Export user data (GDPR compliance)
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await User.findById(userId).select('-password');
    const events = await Event.find({ userId }).limit(1000);
    const sessions = await Session.find({ userId });
    const alerts = await Alert.find({ userId });
    const riskLogs = await RiskLog.find({ userId }).limit(100);
    
    const exportData = {
      user,
      events,
      sessions,
      alerts,
      riskLogs,
      exportedAt: new Date().toISOString()
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="cyberguard-data-${userId}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

module.exports = router;