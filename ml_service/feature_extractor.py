import numpy as np
from typing import List, Dict, Any
import hashlib

# Feature schema - must match across training and inference
FEATURE_SCHEMA = {
    'typing_speed_avg': 0,      # Average WPM
    'typing_speed_std': 1,      # Standard deviation of WPM
    'hold_time_avg': 2,         # Average key hold time (ms)
    'hold_time_std': 3,         # Std dev of hold times
    'flight_time_avg': 4,       # Average time between keystrokes
    'flight_time_std': 5,       # Std dev of flight times
    'mouse_speed_avg': 6,       # Average mouse speed (pixels/s)
    'mouse_speed_std': 7,       # Std dev of mouse speed
    'mouse_acceleration_avg': 8, # Average acceleration
    'click_frequency': 9,       # Clicks per minute
    'app_switches_per_min': 10, # App context switches per minute
    'network_latency_avg': 11,  # Average network latency (ms)
    'network_latency_std': 12,  # Std dev of latency
    'idle_time_ratio': 13,      # Proportion of idle time
    'active_time_minutes': 14,  # Total active session time
    # Total features: 15
}

FEATURE_COUNT = len(FEATURE_SCHEMA)

def extract_features_from_events(events: List[Dict[str, Any]], session_duration_minutes: float = None) -> np.ndarray:
    """
    Extract behavioral features from a list of events.
    
    Args:
        events: List of event dictionaries with type, timestamp, and data
        session_duration_minutes: Optional session duration for normalization
        
    Returns:
        numpy array of shape (FEATURE_COUNT,) with extracted features
    """
    features = np.zeros(FEATURE_COUNT)
    
    if not events:
        return features
    
    # Separate events by type
    keystroke_events = [e for e in events if e.get('type') == 'keystroke']
    mouse_events = [e for e in events if e.get('type') in ['mouse_move', 'mouse_click']]
    app_events = [e for e in events if e.get('type') == 'app_switch']
    network_events = [e for e in events if e.get('type') == 'network_latency']
    idle_events = [e for e in events if e.get('type') == 'idle']
    
    # Estimate session duration if not provided
    if session_duration_minutes is None:
        timestamps = [e.get('timestamp', 0) for e in events if e.get('timestamp')]
        if timestamps:
            duration_ms = max(timestamps) - min(timestamps)
            session_duration_minutes = max(duration_ms / (1000 * 60), 1.0)  # At least 1 minute
        else:
            session_duration_minutes = 1.0
    
    # Extract typing features
    if keystroke_events:
        typing_speeds = [e.get('data', {}).get('typingSpeed', 0) for e in keystroke_events if e.get('data', {}).get('typingSpeed', 0) > 0]
        hold_times = [e.get('data', {}).get('holdTime', 0) for e in keystroke_events if e.get('data', {}).get('holdTime', 0) > 0]
        flight_times = [e.get('data', {}).get('flightTime', 0) for e in keystroke_events if e.get('data', {}).get('flightTime', 0) > 0]
        
        if typing_speeds:
            features[FEATURE_SCHEMA['typing_speed_avg']] = np.mean(typing_speeds)
            features[FEATURE_SCHEMA['typing_speed_std']] = np.std(typing_speeds) if len(typing_speeds) > 1 else 0
        
        if hold_times:
            features[FEATURE_SCHEMA['hold_time_avg']] = np.mean(hold_times)
            features[FEATURE_SCHEMA['hold_time_std']] = np.std(hold_times) if len(hold_times) > 1 else 0
            
        if flight_times:
            features[FEATURE_SCHEMA['flight_time_avg']] = np.mean(flight_times)
            features[FEATURE_SCHEMA['flight_time_std']] = np.std(flight_times) if len(flight_times) > 1 else 0
    
    # Extract mouse features
    if mouse_events:
        mouse_speeds = [e.get('data', {}).get('mouseSpeed', 0) for e in mouse_events if e.get('data', {}).get('mouseSpeed', 0) > 0]
        accelerations = [e.get('data', {}).get('acceleration', 0) for e in mouse_events if e.get('data', {}).get('acceleration', 0) > 0]
        clicks = [e for e in mouse_events if e.get('type') == 'mouse_click']
        
        if mouse_speeds:
            features[FEATURE_SCHEMA['mouse_speed_avg']] = np.mean(mouse_speeds)
            features[FEATURE_SCHEMA['mouse_speed_std']] = np.std(mouse_speeds) if len(mouse_speeds) > 1 else 0
            
        if accelerations:
            features[FEATURE_SCHEMA['mouse_acceleration_avg']] = np.mean(accelerations)
            
        features[FEATURE_SCHEMA['click_frequency']] = len(clicks) / session_duration_minutes
    
    # Extract app usage features
    features[FEATURE_SCHEMA['app_switches_per_min']] = len(app_events) / session_duration_minutes
    
    # Extract network features
    if network_events:
        latencies = [e.get('data', {}).get('latency', 0) for e in network_events if e.get('data', {}).get('latency', 0) > 0]
        
        if latencies:
            features[FEATURE_SCHEMA['network_latency_avg']] = np.mean(latencies)
            features[FEATURE_SCHEMA['network_latency_std']] = np.std(latencies) if len(latencies) > 1 else 0
    
    # Extract activity features
    idle_time_total = sum(e.get('data', {}).get('count', 1) for e in idle_events)
    total_events = len(events)
    
    features[FEATURE_SCHEMA['idle_time_ratio']] = idle_time_total / max(total_events, 1)
    features[FEATURE_SCHEMA['active_time_minutes']] = session_duration_minutes
    
    # Normalize and clip extreme values
    features = np.clip(features, -10, 1000)  # Reasonable bounds for most features
    
    # Replace NaN or infinite values
    features = np.nan_to_num(features, nan=0.0, posinf=1000.0, neginf=-10.0)
    
    return features

def validate_features(features: np.ndarray) -> bool:
    """
    Validate that extracted features are reasonable.
    
    Args:
        features: Feature vector to validate
        
    Returns:
        bool: True if features are valid
    """
    if features.shape[0] != FEATURE_COUNT:
        return False
        
    if np.any(np.isnan(features)) or np.any(np.isinf(features)):
        return False
        
    # Basic sanity checks
    if features[FEATURE_SCHEMA['typing_speed_avg']] < 0 or features[FEATURE_SCHEMA['typing_speed_avg']] > 300:
        return False
        
    if features[FEATURE_SCHEMA['mouse_speed_avg']] < 0 or features[FEATURE_SCHEMA['mouse_speed_avg']] > 10000:
        return False
        
    return True

def get_feature_names() -> List[str]:
    """Return list of feature names in order."""
    return list(FEATURE_SCHEMA.keys())