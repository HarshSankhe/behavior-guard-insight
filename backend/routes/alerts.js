const express = require('express');
const Alert = require('../models/Alert');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/alerts - Get user alerts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, severity } = req.query;
    const userId = req.user.userId;
    
    const filter = { userId };
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    
    const alerts = await Alert.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'username');
      
    const total = await Alert.countDocuments(filter);
    
    res.json({
      alerts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Alerts fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// POST /api/alerts - Create new alert
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { sessionId, type, severity, description, details } = req.body;
    const userId = req.user.userId;
    
    const alert = new Alert({
      userId,
      sessionId,
      type,
      severity: severity || 'Medium',
      description,
      details
    });
    
    await alert.save();
    
    // Emit to WebSocket clients
    const io = req.app.get('io');
    io.to(`session-${sessionId}`).emit('new-alert', alert);
    
    res.status(201).json(alert);
  } catch (error) {
    console.error('Alert creation error:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// PUT /api/alerts/:id - Update alert status
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.userId;
    
    const alert = await Alert.findOne({ _id: id, userId });
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    alert.status = status || alert.status;
    if (notes) alert.notes = notes;
    alert.resolvedAt = status === 'Resolved' ? new Date() : alert.resolvedAt;
    
    await alert.save();
    
    res.json(alert);
  } catch (error) {
    console.error('Alert update error:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// DELETE /api/alerts/:id - Delete alert (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const alert = await Alert.findByIdAndDelete(id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Alert deletion error:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

module.exports = router;