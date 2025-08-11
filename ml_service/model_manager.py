import os
import torch
import threading
import time
from pathlib import Path
from typing import Dict, Optional, Any
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelFileHandler(FileSystemEventHandler):
    """Handles file system events for model files."""
    
    def __init__(self, model_manager):
        self.model_manager = model_manager
        
    def on_modified(self, event):
        if not event.is_directory and event.src_path.endswith('.pt'):
            logger.info(f"Model file modified: {event.src_path}")
            self.model_manager._reload_model_from_path(event.src_path)
    
    def on_created(self, event):
        if not event.is_directory and event.src_path.endswith('.pt'):
            logger.info(f"Model file created: {event.src_path}")
            self.model_manager._reload_model_from_path(event.src_path)

class ModelManager:
    """
    Manages PyTorch autoencoder models with hot-reload capability.
    Watches the models directory and automatically reloads changed models.
    """
    
    def __init__(self, models_dir: str = "models", check_interval: int = 30):
        self.models_dir = Path(models_dir)
        self.models_dir.mkdir(exist_ok=True)
        
        self.check_interval = check_interval
        self._models_cache: Dict[str, Dict[str, Any]] = {}
        self._cache_lock = threading.RLock()
        
        # File watcher
        self.observer = Observer()
        self.file_handler = ModelFileHandler(self)
        
        self._setup_file_watcher()
        self._load_all_models()
        
    def _setup_file_watcher(self):
        """Setup file system watcher for hot-reload."""
        try:
            self.observer.schedule(
                self.file_handler, 
                str(self.models_dir), 
                recursive=False
            )
            self.observer.start()
            logger.info(f"File watcher started for {self.models_dir}")
        except Exception as e:
            logger.error(f"Failed to start file watcher: {e}")
    
    def _load_all_models(self):
        """Load all existing model files."""
        for model_file in self.models_dir.glob("*.pt"):
            self._reload_model_from_path(str(model_file))
    
    def _reload_model_from_path(self, file_path: str):
        """Reload a specific model from file path."""
        try:
            model_id = Path(file_path).stem
            self._load_model(model_id)
        except Exception as e:
            logger.error(f"Failed to reload model from {file_path}: {e}")
    
    def _load_model(self, model_id: str) -> bool:
        """
        Load a model from disk into cache.
        
        Args:
            model_id: Model identifier (user_id or 'global')
            
        Returns:
            bool: True if loaded successfully
        """
        model_path = self.models_dir / f"{model_id}.pt"
        
        if not model_path.exists():
            logger.warning(f"Model file not found: {model_path}")
            return False
            
        try:
            # Load the model checkpoint
            checkpoint = torch.load(model_path, map_location='cpu')
            
            # Validate checkpoint structure
            required_keys = ['model_state_dict', 'mean', 'std', 'feature_count']
            if not all(key in checkpoint for key in required_keys):
                logger.error(f"Invalid model checkpoint structure: {model_path}")
                return False
            
            # Create model instance
            from train_model import BehaviorAutoencoder
            feature_count = checkpoint['feature_count']
            model = BehaviorAutoencoder(feature_count)
            model.load_state_dict(checkpoint['model_state_dict'])
            model.eval()
            
            # Cache the model and metadata
            with self._cache_lock:
                self._models_cache[model_id] = {
                    'model': model,
                    'mean': torch.tensor(checkpoint['mean']),
                    'std': torch.tensor(checkpoint['std']),
                    'feature_count': feature_count,
                    'loaded_at': time.time(),
                    'version': checkpoint.get('version', '1.0'),
                    'training_info': checkpoint.get('training_info', {})
                }
            
            logger.info(f"Model loaded successfully: {model_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load model {model_id}: {e}")
            return False
    
    def get_model(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get model for a specific user, fallback to global model.
        
        Args:
            user_id: User identifier
            
        Returns:
            Dict containing model, mean, std, and metadata or None
        """
        with self._cache_lock:
            # Try user-specific model first
            if user_id in self._models_cache:
                return self._models_cache[user_id].copy()
            
            # Try to load user-specific model
            if self._load_model(user_id):
                return self._models_cache[user_id].copy()
            
            # Fallback to global model
            if 'global' in self._models_cache:
                model_data = self._models_cache['global'].copy()
                model_data['model_used'] = 'global'
                return model_data
            
            # Try to load global model
            if self._load_model('global'):
                model_data = self._models_cache['global'].copy()
                model_data['model_used'] = 'global'
                return model_data
            
            logger.warning(f"No model available for user {user_id} or global fallback")
            return None
    
    def is_model_available(self, user_id: str) -> bool:
        """Check if a model is available for the user."""
        return self.get_model(user_id) is not None
    
    def get_model_info(self, model_id: str) -> Optional[Dict[str, Any]]:
        """Get metadata about a specific model."""
        with self._cache_lock:
            if model_id in self._models_cache:
                model_data = self._models_cache[model_id]
                return {
                    'model_id': model_id,
                    'feature_count': model_data['feature_count'],
                    'loaded_at': model_data['loaded_at'],
                    'version': model_data['version'],
                    'training_info': model_data['training_info']
                }
        return None
    
    def list_available_models(self) -> Dict[str, Dict[str, Any]]:
        """List all available models with metadata."""
        with self._cache_lock:
            return {
                model_id: self.get_model_info(model_id) 
                for model_id in self._models_cache.keys()
            }
    
    def unload_model(self, model_id: str) -> bool:
        """Remove a model from cache."""
        with self._cache_lock:
            if model_id in self._models_cache:
                del self._models_cache[model_id]
                logger.info(f"Model unloaded: {model_id}")
                return True
        return False
    
    def refresh_all_models(self):
        """Force refresh all models from disk."""
        logger.info("Refreshing all models...")
        with self._cache_lock:
            self._models_cache.clear()
        self._load_all_models()
    
    def shutdown(self):
        """Clean shutdown of the model manager."""
        logger.info("Shutting down model manager...")
        if self.observer.is_alive():
            self.observer.stop()
            self.observer.join()
        
        with self._cache_lock:
            self._models_cache.clear()
        
        logger.info("Model manager shutdown complete")

# Global model manager instance
_model_manager_instance = None
_manager_lock = threading.Lock()

def get_model_manager() -> ModelManager:
    """Get the global model manager instance (singleton)."""
    global _model_manager_instance
    
    if _model_manager_instance is None:
        with _manager_lock:
            if _model_manager_instance is None:
                _model_manager_instance = ModelManager()
    
    return _model_manager_instance