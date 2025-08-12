const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const Event = require('../models/Event');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /api/train/:userId - Trigger model training
router.post('/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { force = false, epochs = 50 } = req.body;
    
    // Verify access (admin or own data)
    if (req.user.role !== 'admin' && req.user.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if user exists and has enough data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const eventCount = await Event.countDocuments({ userId });
    if (eventCount < 100 && !force) {
      return res.status(400).json({ 
        error: 'Insufficient training data',
        message: `User has only ${eventCount} events. Minimum 100 required. Use force=true to override.`,
        eventCount
      });
    }
    
    // Call ML service to trigger training
    try {
      const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/train`, {
        user_id: userId,
        epochs: epochs,
        force: force
      }, {
        headers: {
          'X-ML-API-KEY': process.env.ML_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 300000 // 5 minutes timeout for training
      });
      
      res.json({
        message: 'Training initiated successfully',
        userId,
        training: mlResponse.data,
        eventCount
      });
      
    } catch (mlError) {
      console.error('ML service training error:', mlError.message);
      
      if (mlError.code === 'ECONNREFUSED') {
        return res.status(503).json({ 
          error: 'ML service unavailable',
          message: 'Training service is not running'
        });
      }
      
      res.status(500).json({ 
        error: 'Training failed',
        message: mlError.response?.data?.message || mlError.message
      });
    }
    
  } catch (error) {
    console.error('Training trigger error:', error);
    res.status(500).json({ error: 'Failed to trigger training' });
  }
});

// GET /api/train/:userId/status - Get training status
router.get('/:userId/status', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify access
    if (req.user.role !== 'admin' && req.user.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Call ML service for training status
    try {
      const mlResponse = await axios.get(`${process.env.ML_SERVICE_URL}/train/${userId}/status`, {
        headers: {
          'X-ML-API-KEY': process.env.ML_API_KEY
        }
      });
      
      res.json(mlResponse.data);
      
    } catch (mlError) {
      console.error('ML service status error:', mlError.message);
      
      if (mlError.response?.status === 404) {
        return res.json({
          status: 'no_model',
          message: 'No model found for user',
          hasModel: false
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to get training status',
        message: mlError.response?.data?.message || mlError.message
      });
    }
    
  } catch (error) {
    console.error('Training status error:', error);
    res.status(500).json({ error: 'Failed to get training status' });
  }
});

// POST /api/train/global - Train global fallback model (admin only)
router.post('/global', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { epochs = 100, sampleSize = 1000 } = req.body;
    
    // Call ML service to train global model
    try {
      const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/train/global`, {
        epochs,
        sample_size: sampleSize
      }, {
        headers: {
          'X-ML-API-KEY': process.env.ML_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 600000 // 10 minutes timeout for global training
      });
      
      res.json({
        message: 'Global model training initiated',
        training: mlResponse.data
      });
      
    } catch (mlError) {
      console.error('Global training error:', mlError.message);
      res.status(500).json({ 
        error: 'Global training failed',
        message: mlError.response?.data?.message || mlError.message
      });
    }
    
  } catch (error) {
    console.error('Global training trigger error:', error);
    res.status(500).json({ error: 'Failed to trigger global training' });
  }
});

module.exports = router;