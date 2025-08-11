const express = require('express');
const RiskLog = require('../models/RiskLog');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/risk/:userId - Get latest risk score for user
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user can access this data (admin or own data)
    if (req.user.role !== 'admin' && req.user.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get latest risk log
    const latestRisk = await RiskLog.findOne({ userId })
      .sort({ timestamp: -1 })
      .populate('userId', 'username');

    if (!latestRisk) {
      return res.json({
        riskScore: 0,
        factors: {
          typingSpeed: "No data",
          mouseSpeed: "No data", 
          latency: "No data",
          appUsage: "No data"
        },
        timestamp: new Date().toISOString(),
        details: {
          message: "No behavioral data available yet"
        }
      });
    }

    res.json({
      riskScore: latestRisk.riskScore,
      factors: {
        typingSpeed: latestRisk.factors.typingSpeed?.deviation || "Normal",
        mouseSpeed: latestRisk.factors.mouseSpeed?.deviation || "Normal",
        latency: latestRisk.factors.latency?.deviation || "Normal", 
        appUsage: latestRisk.factors.appUsage?.deviation || "Normal"
      },
      timestamp: latestRisk.timestamp.toISOString(),
      details: {
        modelUsed: latestRisk.modelUsed,
        reconstructionError: latestRisk.reconstructionError,
        confidence: latestRisk.factors.overall?.confidence || 0.5,
        eventCount: latestRisk.eventCount
      }
    });
  } catch (error) {
    console.error('Risk fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch risk score' });
  }
});

// GET /api/risk/:userId/history - Get risk score history
router.get('/:userId/history', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { hours = 24, limit = 100 } = req.query;
    
    // Verify access
    if (req.user.role !== 'admin' && req.user.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const riskHistory = await RiskLog.find({ 
      userId,
      timestamp: { $gte: since }
    })
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .select('riskScore timestamp sessionId factors.overall.confidence');

    res.json({
      history: riskHistory.map(log => ({
        riskScore: log.riskScore,
        timestamp: log.timestamp,
        sessionId: log.sessionId,
        confidence: log.factors.overall?.confidence || 0.5
      })),
      timeRange: {
        from: since.toISOString(),
        to: new Date().toISOString(),
        hours: parseInt(hours)
      }
    });
  } catch (error) {
    console.error('Risk history fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch risk history' });
  }
});

module.exports = router;