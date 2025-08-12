const express = require('express');
const Session = require('../models/Session');
const Event = require('../models/Event');
const RiskLog = require('../models/RiskLog');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/sessions - Get user sessions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, active } = req.query;
    const userId = req.user.userId;
    
    const filter = { userId };
    if (active !== undefined) {
      filter.isActive = active === 'true';
    }
    
    const sessions = await Session.find(filter)
      .sort({ startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    const total = await Session.countDocuments(filter);
    
    res.json({
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Sessions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET /api/sessions/:sessionId - Get session details
router.get('/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;
    
    const session = await Session.findOne({ sessionId, userId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Get recent events for this session
    const events = await Event.find({ sessionId, userId })
      .sort({ timestamp: -1 })
      .limit(100);
      
    // Get risk logs for this session
    const riskLogs = await RiskLog.find({ sessionId, userId })
      .sort({ timestamp: -1 })
      .limit(50);
    
    res.json({
      session,
      events,
      riskHistory: riskLogs.map(log => ({
        score: log.riskScore,
        timestamp: log.timestamp,
        factors: log.factors
      }))
    });
  } catch (error) {
    console.error('Session details fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch session details' });
  }
});

// POST /api/sessions/:sessionId/end - End a session
router.post('/:sessionId/end', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;
    
    const session = await Session.findOne({ sessionId, userId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    session.isActive = false;
    session.endTime = new Date();
    await session.save();
    
    res.json({ message: 'Session ended successfully', session });
  } catch (error) {
    console.error('Session end error:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

module.exports = router;