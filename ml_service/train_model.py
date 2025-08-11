import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import pandas as pd
import argparse
import os
from pathlib import Path
from sklearn.preprocessing import StandardScaler
from torch.utils.data import DataLoader, TensorDataset
import logging
from feature_extractor import FEATURE_COUNT, FEATURE_SCHEMA

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BehaviorAutoencoder(nn.Module):
    """
    PyTorch Autoencoder for behavioral anomaly detection.
    Architecture: encoder -> bottleneck -> decoder
    """
    
    def __init__(self, input_dim: int, encoding_dim: int = None):
        super(BehaviorAutoencoder, self).__init__()
        
        if encoding_dim is None:
            encoding_dim = max(input_dim // 4, 2)  # Default to 1/4 of input dim
        
        self.input_dim = input_dim
        self.encoding_dim = encoding_dim
        
        # Encoder
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, input_dim * 2),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(input_dim * 2, input_dim),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(input_dim, encoding_dim),
            nn.ReLU()
        )
        
        # Decoder
        self.decoder = nn.Sequential(
            nn.Linear(encoding_dim, input_dim),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(input_dim, input_dim * 2),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(input_dim * 2, input_dim),
            nn.Sigmoid()  # Output normalized features
        )
    
    def forward(self, x):
        encoded = self.encoder(x)
        decoded = self.decoder(encoded)
        return decoded
    
    def encode(self, x):
        return self.encoder(x)
    
    def decode(self, encoded):
        return self.decoder(encoded)

def load_training_data(data_path: str) -> tuple:
    """
    Load training data from CSV file.
    
    Args:
        data_path: Path to CSV file with training data
        
    Returns:
        tuple: (features_array, metadata)
    """
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Training data file not found: {data_path}")
    
    df = pd.read_csv(data_path)
    
    # Validate that we have the expected feature columns
    expected_features = list(FEATURE_SCHEMA.keys())
    missing_features = [f for f in expected_features if f not in df.columns]
    
    if missing_features:
        raise ValueError(f"Missing features in training data: {missing_features}")
    
    # Extract features in the correct order
    features = df[expected_features].values.astype(np.float32)
    
    # Remove any rows with NaN or infinite values
    valid_mask = np.isfinite(features).all(axis=1)
    features = features[valid_mask]
    
    if len(features) == 0:
        raise ValueError("No valid training samples after filtering")
    
    logger.info(f"Loaded {len(features)} training samples with {features.shape[1]} features")
    
    metadata = {
        'total_samples': len(df),
        'valid_samples': len(features),
        'feature_names': expected_features,
        'data_source': data_path
    }
    
    return features, metadata

def train_autoencoder(features: np.ndarray, 
                     user_id: str,
                     epochs: int = 100,
                     batch_size: int = 32,
                     learning_rate: float = 0.001,
                     encoding_dim: int = None,
                     validation_split: float = 0.2) -> tuple:
    """
    Train autoencoder model on behavioral features.
    
    Args:
        features: Training features array
        user_id: User identifier
        epochs: Number of training epochs
        batch_size: Training batch size
        learning_rate: Learning rate
        encoding_dim: Encoding dimension (None for auto)
        validation_split: Proportion of data for validation
        
    Returns:
        tuple: (model, scaler, training_history)
    """
    # Normalize features
    scaler = StandardScaler()
    features_normalized = scaler.fit_transform(features)
    
    # Split train/validation
    n_samples = len(features_normalized)
    n_val = int(n_samples * validation_split)
    
    indices = np.random.permutation(n_samples)
    train_indices = indices[n_val:]
    val_indices = indices[:n_val]
    
    train_features = features_normalized[train_indices]
    val_features = features_normalized[val_indices] if n_val > 0 else None
    
    # Convert to tensors
    train_tensor = torch.FloatTensor(train_features)
    train_dataset = TensorDataset(train_tensor, train_tensor)  # Autoencoder: input = target
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    
    if val_features is not None:
        val_tensor = torch.FloatTensor(val_features)
    
    # Initialize model
    input_dim = features_normalized.shape[1]
    model = BehaviorAutoencoder(input_dim, encoding_dim)
    
    # Loss and optimizer
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=learning_rate, weight_decay=1e-5)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=10, factor=0.5)
    
    # Training history
    history = {'train_loss': [], 'val_loss': []}
    
    logger.info(f"Training autoencoder for user {user_id}")
    logger.info(f"Model architecture: {input_dim} -> {model.encoding_dim} -> {input_dim}")
    logger.info(f"Training samples: {len(train_features)}, Validation samples: {len(val_features) if val_features is not None else 0}")
    
    # Training loop
    model.train()
    for epoch in range(epochs):
        epoch_train_loss = 0.0
        
        for batch_features, _ in train_loader:
            optimizer.zero_grad()
            
            # Forward pass
            reconstructed = model(batch_features)
            loss = criterion(reconstructed, batch_features)
            
            # Backward pass
            loss.backward()
            optimizer.step()
            
            epoch_train_loss += loss.item()
        
        avg_train_loss = epoch_train_loss / len(train_loader)
        history['train_loss'].append(avg_train_loss)
        
        # Validation
        if val_features is not None:
            model.eval()
            with torch.no_grad():
                val_reconstructed = model(val_tensor)
                val_loss = criterion(val_reconstructed, val_tensor).item()
                history['val_loss'].append(val_loss)
                scheduler.step(val_loss)
            model.train()
        else:
            val_loss = 0.0
            scheduler.step(avg_train_loss)
        
        # Log progress
        if (epoch + 1) % 20 == 0:
            logger.info(f"Epoch {epoch+1}/{epochs} - Train Loss: {avg_train_loss:.6f}, Val Loss: {val_loss:.6f}")
    
    model.eval()
    logger.info(f"Training completed for user {user_id}")
    
    return model, scaler, history

def save_model(model: BehaviorAutoencoder, 
               scaler: StandardScaler,
               user_id: str,
               training_history: dict,
               metadata: dict,
               models_dir: str = "models"):
    """
    Save trained model with all necessary artifacts.
    
    Args:
        model: Trained autoencoder model
        scaler: Fitted StandardScaler
        user_id: User identifier
        training_history: Training history dict
        metadata: Training metadata
        models_dir: Directory to save models
    """
    os.makedirs(models_dir, exist_ok=True)
    
    model_path = os.path.join(models_dir, f"{user_id}.pt")
    
    # Save checkpoint with all necessary data
    checkpoint = {
        'model_state_dict': model.state_dict(),
        'mean': scaler.mean_,
        'std': scaler.scale_,
        'feature_count': model.input_dim,
        'encoding_dim': model.encoding_dim,
        'version': '1.0',
        'training_info': {
            'final_train_loss': training_history['train_loss'][-1] if training_history['train_loss'] else 0,
            'final_val_loss': training_history['val_loss'][-1] if training_history['val_loss'] else 0,
            'epochs_trained': len(training_history['train_loss']),
            'metadata': metadata
        }
    }
    
    torch.save(checkpoint, model_path)
    logger.info(f"Model saved: {model_path}")

def main():
    parser = argparse.ArgumentParser(description='Train behavioral autoencoder model')
    parser.add_argument('--user-id', required=True, help='User ID for model')
    parser.add_argument('--data-path', required=True, help='Path to training CSV file')
    parser.add_argument('--epochs', type=int, default=100, help='Training epochs')
    parser.add_argument('--batch-size', type=int, default=32, help='Batch size')
    parser.add_argument('--lr', type=float, default=0.001, help='Learning rate')
    parser.add_argument('--encoding-dim', type=int, default=None, help='Encoding dimension')
    parser.add_argument('--models-dir', default='models', help='Models output directory')
    
    args = parser.parse_args()
    
    try:
        # Load training data
        features, metadata = load_training_data(args.data_path)
        
        # Train model
        model, scaler, history = train_autoencoder(
            features=features,
            user_id=args.user_id,
            epochs=args.epochs,
            batch_size=args.batch_size,
            learning_rate=args.lr,
            encoding_dim=args.encoding_dim
        )
        
        # Save model
        save_model(model, scaler, args.user_id, history, metadata, args.models_dir)
        
        logger.info(f"✅ Training completed successfully for user {args.user_id}")
        
    except Exception as e:
        logger.error(f"❌ Training failed: {e}")
        raise

if __name__ == "__main__":
    main()