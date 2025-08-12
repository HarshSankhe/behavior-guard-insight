# CyberGuard - AI-Powered Behavioral Micro-Fingerprinting Cybersecurity System

A complete, production-ready cybersecurity system that detects anomalous user behavior through AI-powered behavioral micro-fingerprinting. The system uses PyTorch autoencoders to analyze typing patterns, mouse movements, application usage, and network behavior to produce real-time risk assessments.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Python 3.8+
- MongoDB 6.0+
- Docker & Docker Compose (optional)

### Option 1: Docker Setup (Recommended)
```bash
# Clone and start all services
git clone <your-repo>
cd cyberguard-system

# Start with Docker Compose
docker-compose up -d

# Seed the database
docker exec cyberguard-backend npm run seed

# Generate sample training data and train global model
docker exec cyberguard-ml python generate_sample_data.py --output global_data.csv --samples 2000
docker exec cyberguard-ml python train_model.py --user-id global --data-path global_data.csv --epochs 50
```

### Option 2: Local Development Setup
```bash
# 1. Start MongoDB
mongod --dbpath ./data/db

# 2. Setup Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your settings
npm run seed
npm run dev

# 3. Setup ML Service
cd ../ml_service
pip install -r requirements.txt
# Generate sample data and train global model
python generate_sample_data.py --output global_data.csv --samples 2000
python train_model.py --user-id global --data-path global_data.csv --epochs 50
python ml_service.py

# 4. Start Frontend (existing Lovable project)
npm run dev
```

## 🏗️ Architecture

### Frontend (React + TypeScript + Tailwind)
- **Pages**: Login, Dashboard, Session Monitor, User Profile, Settings
- **Real-time Updates**: WebSocket + polling for live risk scores
- **Authentication**: JWT stored in localStorage

### Backend (Node.js + Express + MongoDB)
- **RESTful API** with modular routes and controllers
- **WebSocket Integration** via Socket.IO for real-time updates
- **JWT Authentication** with role-based access control
- **MongoDB Models**: Users, Events, Sessions, Alerts, RiskLogs

### ML Microservice (Python + FastAPI + PyTorch)
- **PyTorch Autoencoders** for per-user anomaly detection
- **Hot-reload Model Manager** watches models/ directory
- **Feature Extraction** from behavioral events (typing, mouse, network)
- **Risk Scoring**: Reconstruction error → 0-100 risk score

## 📊 Key Features

### Behavioral Monitoring
- **Keystroke Dynamics**: Hold time, flight time, typing speed patterns
- **Mouse Behavior**: Movement speed, acceleration, click patterns
- **Application Usage**: Context switches, focus time (hashed for privacy)
- **Network Latency**: Connection patterns and response times

### AI-Powered Detection
- **Per-User Models**: Individual autoencoder trained on user's normal behavior
- **Global Fallback**: Default model for new users or missing models
- **Real-time Inference**: Sub-second risk score calculation
- **Hot Model Reload**: Automatic detection of new/updated models

### Security & Privacy
- **No Raw Data Storage**: Only aggregated metrics and timing data
- **Encrypted Communications**: HTTPS in production, JWT authentication
- **Consent Management**: User consent tracking and data controls
- **Hashed Identifiers**: Application names and sensitive data hashed

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/login     # Login with username/password
POST /api/auth/logout    # Logout
GET  /api/auth/verify    # Verify JWT token
```

### Event Ingestion
```
POST /api/events         # Submit behavioral events batch
GET  /api/events/:sessionId  # Get session events
```

### Risk Analysis
```
GET  /api/risk/:userId         # Get latest risk score
GET  /api/risk/:userId/history # Get risk history
```

### Management
```
GET  /api/dashboard      # Dashboard data (paginated)
GET  /api/alerts         # Security alerts
POST /api/alerts         # Create alert
GET  /api/sessions       # Recent sessions
POST /api/train/:userId  # Trigger model training
```

### ML Service (Internal)
```
POST /infer             # Risk inference from events
GET  /models            # List available models
GET  /health            # Service health check
```

## 🧠 Machine Learning Pipeline

### 1. Feature Extraction
```python
# Extract 15 behavioral features from events
features = extract_features_from_events(events)
# Features: typing speed, hold times, mouse patterns, etc.
```

### 2. Model Training
```bash
# Train user-specific model
python train_model.py --user-id user123 --data-path user_data.csv --epochs 100

# Train global fallback model
python train_model.py --user-id global --data-path all_users_data.csv --epochs 200
```

### 3. Real-time Inference
```python
# Autoencoder reconstruction error → risk score
risk_score = model_manager.infer_risk(user_id, session_id, events)
# Output: 0-100 risk score with factor analysis
```

### 4. Hot Model Reload
- Models automatically reload when `.pt` files change in `models/` directory
- Zero-downtime model updates for production systems
- Thread-safe model caching and fallback handling

## 🔧 Configuration

### Backend Environment (.env)
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cyberguard
JWT_SECRET=your-256-bit-secret-key
ML_SERVICE_URL=http://localhost:8001
ML_API_KEY=your-ml-api-key
FRONTEND_URL=http://localhost:5173
```

### ML Service Environment
```bash
ML_API_KEY=your-ml-api-key
HOST=0.0.0.0
PORT=8001
```

## 📈 Model Performance

### Training Metrics
- **Reconstruction Loss**: MSE between input and reconstructed features
- **Validation Split**: 20% for model validation during training
- **Early Stopping**: Prevents overfitting with patience-based learning rate reduction

### Risk Score Mapping
- **0-20**: Reconstruction error < 0.01 (Normal behavior)
- **20-50**: Error 0.01-0.05 (Slight deviations)
- **50-80**: Error 0.05-0.15 (Notable anomalies)
- **80-100**: Error > 0.15 (High-risk behavior)

## 🚨 Alerting System

### Alert Types
- **Anomaly Detected**: Behavioral pattern deviations
- **Login from New Device**: Unrecognized device fingerprints
- **Behavioral Deviation**: Significant changes from baseline
- **Suspicious Activity**: High-risk score patterns

### Alert Severities
- **Low**: Minor deviations, informational
- **Medium**: Moderate risk, monitoring recommended
- **High**: Significant anomaly, action required
- **Critical**: Immediate security concern

## 🔒 Security Considerations

### Data Privacy
- All keystroke data is aggregated into timing metrics only
- Application names are cryptographically hashed
- User consent is required and tracked
- Data retention policies configurable per deployment

### Model Security
- Models trained only on consented user data
- No personally identifiable information in model artifacts
- Model files include version control and training metadata

## 🛠️ Development

### Adding New Features
```python
# 1. Add new behavioral feature to feature_extractor.py
FEATURE_SCHEMA['new_feature'] = next_index

# 2. Update extraction logic
def extract_features_from_events(events):
    # ... existing logic
    features[FEATURE_SCHEMA['new_feature']] = compute_new_feature(events)
```

### Testing
```bash
# Backend tests
cd backend && npm test

# ML service tests  
cd ml_service && python -m pytest

# Frontend tests
npm test
```

## 📚 Documentation

- **API Documentation**: Available at `/docs` when backend is running
- **Model Architecture**: See `ml_service/train_model.py` for autoencoder details
- **Feature Schema**: Defined in `ml_service/feature_extractor.py`

## 🚀 Production Deployment

### Environment Setup
1. Configure MongoDB replica set for high availability
2. Set up proper TLS certificates for HTTPS
3. Configure environment variables for production
4. Set up monitoring and alerting for all services

### Scaling Considerations
- Backend can be horizontally scaled with load balancer
- ML service can run multiple instances for high throughput
- MongoDB can be sharded for large-scale deployments
- Model storage can be moved to distributed filesystem

---

## Default Login Credentials

**Username**: `admin`  
**Password**: `password123`

The system includes pre-seeded demo data with sample alerts, sessions, and user profiles for immediate testing.

Built with ❤️ for cybersecurity professionals who need AI-powered behavioral analytics.