# CyberGuard Backend

Backend API server for the AI-Powered Behavioral Micro-Fingerprinting Cybersecurity System.

## Features

- **JWT Authentication** - Secure user login and session management
- **Event Ingestion** - Batch processing of user behavioral events
- **Risk Assessment** - Integration with ML service for real-time risk scoring
- **WebSocket Support** - Real-time updates for dashboard clients
- **MongoDB Integration** - Persistent storage for users, events, sessions, and alerts
- **Rate Limiting** - Protection against abuse
- **RBAC** - Role-based access control (admin/analyst)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify JWT token

### Events
- `POST /api/events` - Ingest batched events
- `GET /api/events/:sessionId` - Get events for session

### Risk Assessment
- `GET /api/risk/:userId` - Get latest risk score
- `GET /api/risk/:userId/history` - Get risk history

### Dashboard
- `GET /api/dashboard` - Get dashboard summary data

### Alerts
- `GET /api/alerts` - Get user alerts
- `POST /api/alerts` - Create new alert
- `PUT /api/alerts/:id` - Update alert status

### Sessions
- `GET /api/sessions` - Get user sessions
- `GET /api/sessions/:sessionId` - Get session details
- `POST /api/sessions/:sessionId/end` - End session

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings
- `GET /api/settings/export` - Export user data (GDPR)

### Training
- `POST /api/train/:userId` - Trigger model training
- `GET /api/train/:userId/status` - Get training status
- `POST /api/train/global` - Train global model (admin)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Configure your `.env` file with:
   - MongoDB connection string
   - JWT secret (minimum 256 bits)
   - ML service URL and API key
   - Frontend URL for CORS

4. Seed the database:
```bash
npm run seed
```

5. Start the server:
```bash
npm run dev  # Development mode
npm start    # Production mode
```

## Environment Variables

See `.env.example` for all required configuration options.

## Database Models

### User
- Authentication and profile data
- Behavioral baseline metrics
- Settings and preferences

### Event
- Aggregated behavioral events (no raw keystrokes)
- Timing data, mouse patterns, app usage
- Privacy-compliant data storage

### Session
- User session tracking
- Risk score history
- Activity metadata

### Alert
- Security alerts and notifications
- Risk assessment results
- Resolution status

### RiskLog
- Historical risk assessments
- ML model predictions
- Confidence scores

## Security

- JWT tokens with 24-hour expiration
- Password hashing with bcrypt
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers
- Input validation

## Integration with ML Service

The backend communicates with the ML service via HTTP API:
- Event data is forwarded for risk assessment
- Training requests are proxied to ML service
- Results are stored and cached locally

## WebSocket Events

- `new-alert` - Real-time alert notifications
- `risk-update` - Live risk score updates
- `session-event` - Session activity updates