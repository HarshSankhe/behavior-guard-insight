# CyberGuard ML Service

PyTorch-based machine learning microservice for behavioral anomaly detection using autoencoder neural networks.

## Features

- **Per-User Autoencoders** - Individual models for each user's behavioral patterns
- **Real-time Inference** - Fast risk assessment API
- **Hot Model Reloading** - Automatic model updates without service restart
- **Feature Engineering** - Behavioral metrics extraction from raw events
- **Global Fallback Model** - Default model for new users
- **Training Pipeline** - Automated model training and validation

## Architecture

### Core Components

1. **ml_service.py** - FastAPI web server with inference endpoints
2. **ai_real_service.py** - Risk assessment logic and model interface
3. **model_manager.py** - Model loading, caching, and hot-reload functionality
4. **feature_extractor.py** - Feature engineering pipeline
5. **train_model.py** - PyTorch autoencoder training script

### Autoencoder Architecture

```python
Input Layer (24 features) 
    ↓
Encoder (24 → 16 → 8)
    ↓
Latent Space (8 dimensions)
    ↓  
Decoder (8 → 16 → 24)
    ↓
Reconstruction (24 features)
```

Risk Score = Reconstruction Error * 100 (normalized)

## API Endpoints

### Inference
- `POST /infer` - Get risk assessment for events
- `GET /health` - Service health check

### Training
- `POST /train` - Train user-specific model
- `GET /train/{user_id}/status` - Get training status
- `POST /train/global` - Train global fallback model

## Feature Schema

The system extracts 24 behavioral features:

```python
FEATURES = [
    # Keystroke Dynamics (8 features)
    'keystroke_hold_time_mean', 'keystroke_hold_time_std',
    'keystroke_flight_time_mean', 'keystroke_flight_time_std', 
    'typing_speed_mean', 'typing_speed_std',
    'keystroke_rhythm_score', 'keystroke_count',
    
    # Mouse Dynamics (8 features)
    'mouse_speed_mean', 'mouse_speed_std',
    'mouse_acceleration_mean', 'mouse_acceleration_std',
    'mouse_movement_smoothness', 'mouse_click_frequency',
    'mouse_dwell_time_mean', 'mouse_count',
    
    # Application Usage (4 features)
    'app_switch_frequency', 'app_focus_time_variance',
    'unique_apps_count', 'app_switch_count',
    
    # Network Patterns (4 features)
    'network_latency_mean', 'network_latency_std',
    'packet_loss_rate', 'network_count'
]
```

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create models directory:
```bash
mkdir -p models data
```

3. Generate sample training data:
```bash
python generate_sample_data.py --output data/sample_data.csv --users 5 --sessions 10
```

4. Train a global model:
```bash
python train_model.py --user-id global --data-path data/sample_data.csv --epochs 100
```

5. Start the service:
```bash
python ml_service.py
```

## Training Models

### Train User-Specific Model
```bash
python train_model.py \
    --user-id "user123" \
    --data-path "user_data.csv" \
    --epochs 50 \
    --batch-size 32 \
    --learning-rate 0.001
```

### Train Global Fallback Model
```bash
python train_model.py \
    --user-id "global" \
    --data-path "all_users_data.csv" \
    --epochs 100 \
    --batch-size 64
```

## Model Files

Models are saved as `.pt` files containing:
```python
{
    'model_state_dict': model.state_dict(),
    'feature_mean': training_mean,
    'feature_std': training_std,
    'feature_schema': FEATURE_SCHEMA,
    'training_metadata': {
        'epochs': epochs,
        'loss': final_loss,
        'timestamp': training_time
    }
}
```

## Hot Model Reloading

The service automatically watches the `models/` directory and reloads models when files change:

- New model files are loaded automatically
- Updated models replace cached versions
- Model loading is thread-safe
- Failed loads don't affect existing models

## Risk Assessment Process

1. **Feature Extraction** - Convert raw events to behavioral metrics
2. **Normalization** - Apply stored mean/std from training
3. **Model Inference** - Forward pass through autoencoder
4. **Risk Calculation** - Reconstruction error → risk score (0-100)
5. **Factor Analysis** - Individual feature deviations
6. **Response Formation** - JSON with score, factors, details

## Example Usage

### Event Ingestion
```python
import requests

events = [
    {
        "type": "keystroke",
        "timestamp": "2024-01-01T10:00:00Z",
        "data": {
            "holdTime": 120,
            "flightTime": 95,
            "typingSpeed": 65
        }
    },
    {
        "type": "mouse_move", 
        "timestamp": "2024-01-01T10:00:01Z",
        "data": {
            "mouseSpeed": 0.35,
            "acceleration": 1.2
        }
    }
]

response = requests.post('http://localhost:8001/infer', json={
    'user_id': 'user123',
    'session_id': 'session456', 
    'events': events
})

risk_data = response.json()
```

### Response Format
```json
{
    "riskScore": 23,
    "factors": {
        "typingSpeed": "Normal",
        "mouseSpeed": "Normal", 
        "latency": "Slight increase",
        "appUsage": "Normal"
    },
    "timestamp": "2024-01-01T10:00:00Z",
    "details": {
        "modelUsed": "user123",
        "reconstructionError": 0.23,
        "confidence": 0.87,
        "eventCount": 2
    }
}
```

## Performance

- **Inference Speed**: ~10ms per request
- **Model Loading**: ~100ms per model
- **Memory Usage**: ~50MB per loaded model
- **Concurrent Requests**: Up to 100/second

## Monitoring

Check service health:
```bash
curl http://localhost:8001/health
```

Response:
```json
{
    "status": "healthy",
    "models_loaded": 3,
    "uptime_seconds": 12345
}
```