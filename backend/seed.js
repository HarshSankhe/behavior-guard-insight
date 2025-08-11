const mongoose = require('mongoose');
const User = require('./models/User');
const Alert = require('./models/Alert');
const Session = require('./models/Session');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cyberguard';

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Alert.deleteMany({});
    await Session.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Create demo user
    const demoUser = new User({
      username: 'admin',
      email: 'admin@cyberguard.com',
      password: 'password123', // Will be hashed by middleware
      role: 'admin',
      consent: true,
      profile: {
        typicalTypingSpeed: 65,
        avgMouseSpeed: 0.35,
        networkLatencyRange: { min: 20, max: 40 },
        deviceFingerprint: 'FP-DEMO-4A7B9C2E',
        behaviorScore: 92.5
      },
      settings: {
        sensitivity: 'High',
        realTimeMonitoring: true,
        alertNotifications: true,
        anomalyDetection: true
      }
    });
    
    await demoUser.save();
    console.log('👤 Created demo user: admin/password123');

    // Create sample alerts
    const alerts = [
      {
        userId: demoUser._id,
        sessionId: 'demo-session-1',
        type: 'Anomaly Detected',
        severity: 'High',
        status: 'Unresolved',
        description: 'Unusual keystroke patterns detected during login session',
        details: {
          riskScore: 85,
          factors: {
            typingSpeed: 'High deviation (+25%)',
            mouseSpeed: 'Normal',
            latency: 'Slight increase',
            appUsage: 'Normal'
          },
          recommendations: ['Consider secondary authentication', 'Monitor session closely']
        }
      },
      {
        userId: demoUser._id,
        sessionId: 'demo-session-2',
        type: 'Login from New Device',
        severity: 'Medium',
        status: 'Resolved',
        description: 'New device detected for user authentication',
        details: {
          riskScore: 45,
          factors: {
            typingSpeed: 'Normal',
            mouseSpeed: 'Normal',
            latency: 'Normal',
            appUsage: 'New device fingerprint'
          }
        }
      }
    ];

    await Alert.insertMany(alerts);
    console.log('🚨 Created sample alerts');

    // Create sample sessions
    const sessions = [
      {
        sessionId: 'demo-session-1',
        userId: demoUser._id,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        endTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        isActive: false,
        riskScore: { current: 85, max: 85, average: 72 },
        eventCount: 1247,
        metadata: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ipAddress: '192.168.1.100',
          deviceFingerprint: 'FP-DEMO-4A7B9C2E'
        }
      },
      {
        sessionId: 'demo-session-current',
        userId: demoUser._id,
        startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        isActive: true,
        riskScore: { current: 23, max: 45, average: 28 },
        eventCount: 534,
        lastActivity: new Date(),
        metadata: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ipAddress: '192.168.1.100',
          deviceFingerprint: 'FP-DEMO-4A7B9C2E'
        }
      }
    ];

    await Session.insertMany(sessions);
    console.log('🖥️ Created sample sessions');

    // Create global model file if it doesn't exist
    const modelsDir = path.join(__dirname, '..', 'ml_service', 'models');
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }

    const globalModelPath = path.join(modelsDir, 'global.pt');
    if (!fs.existsSync(globalModelPath)) {
      console.log('📊 Creating placeholder global model...');
      // This would normally be created by running the training script
      // For demo purposes, we'll create a minimal placeholder
      console.log('ℹ️ Run training script to create actual model: python train_model.py --user-id global --data-path sample_data.csv');
    }

    console.log('✅ Database seeding completed successfully!');
    console.log('\n🚀 You can now login with:');
    console.log('   Username: admin');
    console.log('   Password: password123');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };