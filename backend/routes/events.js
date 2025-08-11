const express = require('express');
const Event = require('../models/Event');
const Session = require('../models/Session');
const { authMiddleware } = require('../middleware/auth');
const { processRiskScore } = require('../services/riskService');

const router = express.Router();

// POST /api/events - Ingest batched events
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { session_id, events } = req.body;
    const userId = req.user.userId;

    if (!session_id || !events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'session_id and events array are required' });
    }

    // Find or create session
    let session = await Session.findOne({ sessionId: session_id, userId });
    if (!session) {
      session = new Session({
        sessionId: session_id,
        userId,
        metadata: req.body.metadata || {}
      });
      await session.save();
    }

    // Process and save events
    const eventDocs = events.map(event => ({
      userId,
      sessionId: session_id,
      type: event.type,
      timestamp: new Date(event.timestamp || Date.now()),
      data: event.data || {}
    }));

    await Event.insertMany(eventDocs);

    // Update session
    session.eventCount += events.length;
    session.lastActivity = new Date();
    await session.save();

    // Process risk score asynchronously
    processRiskScore(userId, session_id, events, req.app.get('io'));

    res.json({ 
      success: true,
      message: `${events.length} events ingested`,
      sessionId: session_id
    });
  } catch (error) {
    console.error('Event ingestion error:', error);
    res.status(500).json({ error: 'Failed to ingest events' });
  }
});

// GET /api/events/:sessionId - Get events for a session
router.get('/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 100 } = req.query;

    const events = await Event.find({ 
      sessionId,
      userId: req.user.userId 
    })
    .sort({ timestamp: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Event.countDocuments({ 
      sessionId,
      userId: req.user.userId 
    });

    res.json({
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Events fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

module.exports = router;