import torch
import numpy as np
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime
from feature_extractor import extract_features_from_events, validate_features, FEATURE_COUNT
from model_manager import get_model_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIRealService:
    """
    AI inference service for behavioral anomaly detection.
    Uses PyTorch autoencoders to compute risk scores from user events.
    """
    
    def __init__(self):
        self.model_manager = get_model_manager()
        self.risk_thresholds = {
            'low': 0.01,      # Reconstruction error thresholds
            'medium': 0.05,
            'high': 0.15,
            'critical': 0.30
        }
    
    def infer_risk(self, user_id: str, session_id: str, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Perform inference to calculate risk score from behavioral events.
        
        Args:
            user_id: User identifier
            session_id: Session identifier  
            events: List of behavioral events
            
        Returns:
            Dict with riskScore, factors, timestamp, and details
        """
        try:
            logger.info(f"Processing inference for user {user_id}, session {session_id}, {len(events)} events")
            
            # Extract features from events
            features = extract_features_from_events(events)
            
            if not validate_features(features):
                logger.warning(f"Invalid features extracted for user {user_id}")
                return self._create_fallback_response(user_id, session_id, "Invalid features")
            
            # Get model for user
            model_data = self.model_manager.get_model(user_id)
            if model_data is None:
                logger.warning(f"No model available for user {user_id}")
                return self._create_fallback_response(user_id, session_id, "No model available")
            
            # Perform inference
            risk_score, reconstruction_error, factor_analysis = self._compute_risk_score(
                features, model_data
            )
            
            # Generate response
            response = {
                "riskScore": int(risk_score),
                "factors": self._generate_factors(features, factor_analysis),
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "details": {
                    "modelUsed": model_data.get('model_used', user_id),
                    "reconstructionError": float(reconstruction_error),
                    "confidence": self._calculate_confidence(reconstruction_error, len(events)),
                    "eventCount": len(events),
                    "anomalies": self._detect_anomalies(features, factor_analysis),
                    "featureCount": len(features)
                }
            }
            
            logger.info(f"Inference completed: risk={risk_score}%, error={reconstruction_error:.6f}")
            return response
            
        except Exception as e:
            logger.error(f"Inference error for user {user_id}: {e}")
            return self._create_fallback_response(user_id, session_id, f"Inference error: {str(e)}")
    
    def _compute_risk_score(self, features: np.ndarray, model_data: Dict[str, Any]) -> tuple:
        """
        Compute risk score using autoencoder reconstruction error.
        
        Args:
            features: Extracted behavioral features
            model_data: Model and normalization data
            
        Returns:
            tuple: (risk_score, reconstruction_error, factor_analysis)
        """
        model = model_data['model']
        mean = model_data['mean']
        std = model_data['std']
        
        # Normalize features
        features_tensor = torch.FloatTensor(features)
        features_normalized = (features_tensor - mean) / (std + 1e-8)  # Add small epsilon
        
        # Forward pass through autoencoder
        with torch.no_grad():
            reconstructed = model(features_normalized.unsqueeze(0))
            reconstruction_error = torch.nn.functional.mse_loss(
                reconstructed.squeeze(), features_normalized
            ).item()
        
        # Convert reconstruction error to risk score (0-100)
        risk_score = self._error_to_risk_score(reconstruction_error)
        
        # Analyze individual feature deviations
        feature_errors = torch.abs(reconstructed.squeeze() - features_normalized).numpy()
        factor_analysis = {
            'feature_errors': feature_errors,
            'normalized_features': features_normalized.numpy(),
            'reconstructed_features': reconstructed.squeeze().numpy()
        }
        
        return risk_score, reconstruction_error, factor_analysis
    
    def _error_to_risk_score(self, reconstruction_error: float) -> int:
        """
        Convert reconstruction error to risk score (0-100).
        
        Args:
            reconstruction_error: MSE reconstruction error
            
        Returns:
            int: Risk score between 0 and 100
        """
        # Logarithmic scaling to map error to 0-100 range
        # Lower errors -> lower risk, higher errors -> higher risk
        
        if reconstruction_error <= self.risk_thresholds['low']:
            return max(0, int(20 * reconstruction_error / self.risk_thresholds['low']))
        elif reconstruction_error <= self.risk_thresholds['medium']:
            return 20 + int(30 * (reconstruction_error - self.risk_thresholds['low']) / 
                           (self.risk_thresholds['medium'] - self.risk_thresholds['low']))
        elif reconstruction_error <= self.risk_thresholds['high']:
            return 50 + int(30 * (reconstruction_error - self.risk_thresholds['medium']) / 
                           (self.risk_thresholds['high'] - self.risk_thresholds['medium']))
        elif reconstruction_error <= self.risk_thresholds['critical']:
            return 80 + int(15 * (reconstruction_error - self.risk_thresholds['high']) / 
                           (self.risk_thresholds['critical'] - self.risk_thresholds['high']))
        else:
            return min(100, 95 + int(5 * min(reconstruction_error / self.risk_thresholds['critical'], 2)))
    
    def _generate_factors(self, features: np.ndarray, factor_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate human-readable factor analysis.
        
        Args:
            features: Original features
            factor_analysis: Feature-level analysis data
            
        Returns:
            Dict with factor descriptions
        """
        from feature_extractor import FEATURE_SCHEMA
        
        feature_errors = factor_analysis['feature_errors']
        
        # Map feature indices to names
        idx_typing_speed = FEATURE_SCHEMA['typing_speed_avg']
        idx_mouse_speed = FEATURE_SCHEMA['mouse_speed_avg']  
        idx_latency = FEATURE_SCHEMA['network_latency_avg']
        idx_app_switches = FEATURE_SCHEMA['app_switches_per_min']
        
        # Analyze deviations
        typing_deviation = self._categorize_deviation(feature_errors[idx_typing_speed])
        mouse_deviation = self._categorize_deviation(feature_errors[idx_mouse_speed])
        latency_deviation = self._categorize_deviation(feature_errors[idx_latency])
        app_deviation = self._categorize_deviation(feature_errors[idx_app_switches])
        
        return {
            "typingSpeed": {
                "value": float(features[idx_typing_speed]),
                "deviation": typing_deviation
            },
            "mouseSpeed": {
                "value": float(features[idx_mouse_speed]),
                "deviation": mouse_deviation
            },
            "latency": {
                "value": float(features[idx_latency]),
                "deviation": latency_deviation
            },
            "appUsage": {
                "value": float(features[idx_app_switches]),
                "deviation": app_deviation
            }
        }
    
    def _categorize_deviation(self, error: float) -> str:
        """Categorize feature deviation level."""
        if error < 0.5:
            return "Normal"
        elif error < 1.0:
            return "Slight"
        elif error < 2.0:
            return "Moderate"
        elif error < 3.0:
            return "High"
        else:
            return "Critical"
    
    def _calculate_confidence(self, reconstruction_error: float, event_count: int) -> float:
        """
        Calculate confidence score for the risk assessment.
        
        Args:
            reconstruction_error: Model reconstruction error
            event_count: Number of events processed
            
        Returns:
            float: Confidence score between 0.0 and 1.0
        """
        # Confidence decreases with higher error and increases with more events
        error_confidence = max(0.1, 1.0 - min(reconstruction_error / 0.5, 1.0))
        sample_confidence = min(1.0, event_count / 50.0)  # Full confidence at 50+ events
        
        return min(1.0, (error_confidence + sample_confidence) / 2.0)
    
    def _detect_anomalies(self, features: np.ndarray, factor_analysis: Dict[str, Any]) -> List[str]:
        """
        Detect specific anomalies in behavioral patterns.
        
        Args:
            features: Original features
            factor_analysis: Feature-level analysis data
            
        Returns:
            List of anomaly descriptions
        """
        anomalies = []
        feature_errors = factor_analysis['feature_errors']
        
        from feature_extractor import FEATURE_SCHEMA
        
        # Check for significant deviations
        if feature_errors[FEATURE_SCHEMA['typing_speed_avg']] > 2.0:
            anomalies.append("Unusual typing speed pattern")
        
        if feature_errors[FEATURE_SCHEMA['mouse_speed_avg']] > 2.0:
            anomalies.append("Abnormal mouse movement behavior")
        
        if feature_errors[FEATURE_SCHEMA['network_latency_avg']] > 2.0:
            anomalies.append("Network latency deviation")
        
        if feature_errors[FEATURE_SCHEMA['app_switches_per_min']] > 2.0:
            anomalies.append("Irregular application usage")
        
        # Check for extreme values
        if features[FEATURE_SCHEMA['typing_speed_avg']] > 200:
            anomalies.append("Extremely high typing speed")
        elif features[FEATURE_SCHEMA['typing_speed_avg']] < 10 and features[FEATURE_SCHEMA['typing_speed_avg']] > 0:
            anomalies.append("Unusually slow typing speed")
        
        if features[FEATURE_SCHEMA['click_frequency']] > 10:
            anomalies.append("Excessive mouse clicking")
        
        return anomalies
    
    def _create_fallback_response(self, user_id: str, session_id: str, reason: str) -> Dict[str, Any]:
        """
        Create fallback response when inference fails.
        
        Args:
            user_id: User identifier
            session_id: Session identifier
            reason: Reason for fallback
            
        Returns:
            Dict: Fallback response with neutral risk score
        """
        return {
            "riskScore": 50,  # Neutral risk score
            "factors": {
                "typingSpeed": {"value": 0, "deviation": "Unknown"},
                "mouseSpeed": {"value": 0, "deviation": "Unknown"},
                "latency": {"value": 0, "deviation": "Unknown"},
                "appUsage": {"value": 0, "deviation": "Unknown"}
            },
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "details": {
                "modelUsed": "fallback",
                "reconstructionError": 0.0,
                "confidence": 0.1,
                "eventCount": 0,
                "anomalies": [f"Fallback mode: {reason}"],
                "featureCount": FEATURE_COUNT
            }
        }

# Global service instance
_ai_service_instance = None

def get_ai_service() -> AIRealService:
    """Get the global AI service instance."""
    global _ai_service_instance
    if _ai_service_instance is None:
        _ai_service_instance = AIRealService()
    return _ai_service_instance