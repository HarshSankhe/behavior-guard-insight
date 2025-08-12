const express = require('express');
const RiskLog = require('../models/RiskLog');
const Alert = require('../models/Alert');
const Session = require('../models/Session');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard - Get dashboard summary data
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { hours = 24 } = req.query;
    
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    // Get latest risk score
    const latestRisk = await RiskLog.findOne({ userId })
      .sort({ timestamp: -1 });
    
    // Get recent alerts
    const recentAlerts = await Alert.find({ 
      userId,
      timestamp: { $gte: since }
    })
    .sort({ timestamp: -1 })
    .limit(10);
    
    // Get active sessions
    const activeSessions = await Session.find({
      userId,
      isActive: true
    }).sort({ startTime: -1 });
    
    // Get risk history for chart
    const riskHistory = await RiskLog.find({
      userId,
      timestamp: { $gte: since }
    })
    .sort({ timestamp: -1 })
    .limit(50)
    .select('riskScore timestamp');
    
    // Calculate stats
    const totalAlerts = await Alert.countDocuments({ 
      userId,
      timestamp: { $gte: since }
    });
    
    const unresolvedAlerts = await Alert.countDocuments({
      userId,
      status: 'Unresolved',
      timestamp: { $gte: since }
    });
    
    res.json({
      currentRisk: {
        score: latestRisk?.riskScore || 0,
        timestamp: latestRisk?.timestamp || new Date(),
        factors: latestRisk?.factors || {}
      },
      alerts: {
        recent: recentAlerts,
        total: totalAlerts,
        unresolved: unresolvedAlerts
      },
      sessions: {
        active: activeSessions.length,
        current: activeSessions[0] || null
      },
      riskHistory: riskHistory.map(log => ({
        score: log.riskScore,
        timestamp: log.timestamp
      })),
      timeRange: {
        from: since.toISOString(),
        to: new Date().toISOString(),
        hours: parseInt(hours)
      }
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;