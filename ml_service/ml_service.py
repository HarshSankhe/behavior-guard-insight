from fastapi import FastAPI, HTTPException, Header, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
import os
from ai_real_service import get_ai_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="CyberGuard ML Service",
    description="AI-powered behavioral micro-fingerprinting for cybersecurity",
    version="1.0.0"
)

# Expected API key for authentication
EXPECTED_API_KEY = os.getenv('ML_API_KEY', 'dev-ml-api-key-123')

# Pydantic models for request/response
class Event(BaseModel):
    type: str
    timestamp: Optional[int] = None
    data: Optional[Dict[str, Any]] = {}

class InferenceRequest(BaseModel):
    user_id: str
    session_id: str
    events: List[Event]

class InferenceResponse(BaseModel):
    riskScore: int
    factors: Dict[str, Any]
    timestamp: str
    details: Dict[str, Any]

# API key dependency
def verify_api_key(x_ml_api_key: str = Header(...)):
    """Verify ML service API key."""
    if x_ml_api_key != EXPECTED_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_ml_api_key

@app.on_startup
async def startup_event():
    """Initialize ML service on startup."""
    logger.info("🤖 Starting CyberGuard ML Service...")
    
    # Initialize AI service (this will load models)
    ai_service = get_ai_service()
    logger.info("✅ AI service initialized")
    
    # Log available models
    models = ai_service.model_manager.list_available_models()
    logger.info(f"📊 Available models: {list(models.keys())}")

@app.on_shutdown
async def shutdown_event():
    """Clean shutdown of ML service."""
    logger.info("🔄 Shutting down ML service...")
    
    # Shutdown model manager
    ai_service = get_ai_service()
    ai_service.model_manager.shutdown()
    
    logger.info("✅ ML service shutdown complete")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "CyberGuard ML Service",
        "version": "1.0.0"
    }

@app.post("/infer", response_model=InferenceResponse)
async def infer_risk(
    request: InferenceRequest,
    api_key: str = Depends(verify_api_key)
) -> InferenceResponse:
    """
    Perform risk inference from behavioral events.
    
    Args:
        request: Inference request with user_id, session_id, and events
        api_key: API key for authentication
        
    Returns:
        InferenceResponse with risk score, factors, and details
    """
    try:
        logger.info(f"🔍 Inference request: user={request.user_id}, session={request.session_id}, events={len(request.events)}")
        
        # Validate request
        if not request.user_id or not request.session_id:
            raise HTTPException(status_code=400, detail="user_id and session_id are required")
        
        if not request.events:
            raise HTTPException(status_code=400, detail="events list cannot be empty")
        
        # Convert events to dict format expected by AI service
        events_data = []
        for event in request.events:
            event_dict = {
                "type": event.type,
                "timestamp": event.timestamp,
                "data": event.data or {}
            }
            events_data.append(event_dict)
        
        # Get AI service and perform inference
        ai_service = get_ai_service()
        result = ai_service.infer_risk(
            user_id=request.user_id,
            session_id=request.session_id,
            events=events_data
        )
        
        logger.info(f"✅ Inference completed: risk={result['riskScore']}%")
        
        return InferenceResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Inference error: {e}")
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")

@app.get("/models")
async def list_models(api_key: str = Depends(verify_api_key)):
    """List available models."""
    try:
        ai_service = get_ai_service()
        models = ai_service.model_manager.list_available_models()
        
        return {
            "models": models,
            "total_count": len(models)
        }
    except Exception as e:
        logger.error(f"❌ Error listing models: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list models: {str(e)}")

@app.post("/models/{model_id}/refresh")
async def refresh_model(model_id: str, api_key: str = Depends(verify_api_key)):
    """Refresh a specific model from disk."""
    try:
        ai_service = get_ai_service()
        
        # Force reload the model
        ai_service.model_manager.unload_model(model_id)
        success = ai_service.model_manager._load_model(model_id)
        
        if success:
            return {"message": f"Model {model_id} refreshed successfully"}
        else:
            raise HTTPException(status_code=404, detail=f"Model {model_id} not found or failed to load")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error refreshing model {model_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to refresh model: {str(e)}")

@app.get("/models/{model_id}/info")
async def get_model_info(model_id: str, api_key: str = Depends(verify_api_key)):
    """Get information about a specific model."""
    try:
        ai_service = get_ai_service()
        model_info = ai_service.model_manager.get_model_info(model_id)
        
        if model_info is None:
            raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
        
        return model_info
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting model info for {model_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get model info: {str(e)}")

# Development endpoint for testing
@app.post("/test-inference")
async def test_inference():
    """Test endpoint with sample data for development."""
    sample_events = [
        {
            "type": "keystroke",
            "timestamp": 1691766600000,
            "data": {
                "holdTime": 120,
                "flightTime": 200,
                "typingSpeed": 65
            }
        },
        {
            "type": "mouse_move",
            "timestamp": 1691766601000,
            "data": {
                "mouseSpeed": 350,
                "acceleration": 1.2
            }
        }
    ]
    
    ai_service = get_ai_service()
    result = ai_service.infer_risk(
        user_id="test_user",
        session_id="test_session",
        events=sample_events
    )
    
    return result

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv('PORT', 8001))
    host = os.getenv('HOST', '0.0.0.0')
    
    logger.info(f"🚀 Starting ML service on {host}:{port}")
    
    uvicorn.run(
        "ml_service:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )