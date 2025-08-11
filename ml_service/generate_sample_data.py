#!/usr/bin/env python3
"""
Generate synthetic training data for behavioral autoencoder models.
Creates realistic user behavior patterns with some variance.
"""

import pandas as pd
import numpy as np
import argparse
from feature_extractor import FEATURE_SCHEMA

def generate_user_baseline(user_type='normal'):
    """Generate baseline behavioral characteristics for a user type."""
    
    if user_type == 'fast_typer':
        return {
            'typing_speed_base': 85, 'typing_speed_std': 12,
            'hold_time_base': 80, 'hold_time_std': 15,
            'flight_time_base': 150, 'flight_time_std': 30,
            'mouse_speed_base': 450, 'mouse_speed_std': 80,
            'click_freq_base': 2.5, 'latency_base': 25
        }
    elif user_type == 'slow_careful':
        return {
            'typing_speed_base': 35, 'typing_speed_std': 8,
            'hold_time_base': 150, 'hold_time_std': 25,
            'flight_time_base': 350, 'flight_time_std': 60,
            'mouse_speed_base': 200, 'mouse_speed_std': 40,
            'click_freq_base': 1.2, 'latency_base': 35
        }
    else:  # normal
        return {
            'typing_speed_base': 60, 'typing_speed_std': 10,
            'hold_time_base': 110, 'hold_time_std': 20,
            'flight_time_base': 220, 'flight_time_std': 40,
            'mouse_speed_base': 320, 'mouse_speed_std': 60,
            'click_freq_base': 1.8, 'latency_base': 30
        }

def generate_sample_data(n_samples=1000, user_type='normal', anomaly_rate=0.05):
    """
    Generate synthetic behavioral data samples.
    
    Args:
        n_samples: Number of samples to generate
        user_type: Type of user behavior baseline
        anomaly_rate: Proportion of anomalous samples
        
    Returns:
        pandas.DataFrame with behavioral features
    """
    
    baseline = generate_user_baseline(user_type)
    
    # Initialize feature matrix
    features = {}
    
    # Generate normal samples
    n_normal = int(n_samples * (1 - anomaly_rate))
    n_anomaly = n_samples - n_normal
    
    # Typing features
    typing_speeds = np.random.normal(baseline['typing_speed_base'], baseline['typing_speed_std'], n_normal)
    typing_speeds = np.clip(typing_speeds, 10, 200)  # Reasonable bounds
    
    hold_times = np.random.normal(baseline['hold_time_base'], baseline['hold_time_std'], n_normal)
    hold_times = np.clip(hold_times, 50, 300)
    
    flight_times = np.random.normal(baseline['flight_time_base'], baseline['flight_time_std'], n_normal)
    flight_times = np.clip(flight_times, 80, 800)
    
    # Mouse features
    mouse_speeds = np.random.normal(baseline['mouse_speed_base'], baseline['mouse_speed_std'], n_normal)
    mouse_speeds = np.clip(mouse_speeds, 50, 1000)
    
    mouse_accelerations = np.random.gamma(2, 0.5, n_normal)  # Gamma distribution for acceleration
    
    click_frequencies = np.random.poisson(baseline['click_freq_base'], n_normal)
    
    # Network and app features
    latencies = np.random.normal(baseline['latency_base'], 8, n_normal)
    latencies = np.clip(latencies, 10, 200)
    
    app_switches = np.random.poisson(0.8, n_normal)  # App switches per minute
    
    # Activity features
    idle_ratios = np.random.beta(2, 8, n_normal)  # Beta distribution for idle time ratio
    active_times = np.random.exponential(15, n_normal)  # Session lengths
    
    # Add anomalous samples
    if n_anomaly > 0:
        # Generate anomalies by adding significant noise
        anomaly_factor = 3.0
        
        typing_speeds_anom = np.random.normal(
            baseline['typing_speed_base'], 
            baseline['typing_speed_std'] * anomaly_factor, 
            n_anomaly
        )
        typing_speeds = np.concatenate([typing_speeds, typing_speeds_anom])
        
        hold_times_anom = np.random.normal(
            baseline['hold_time_base'], 
            baseline['hold_time_std'] * anomaly_factor, 
            n_anomaly
        )
        hold_times = np.concatenate([hold_times, hold_times_anom])
        
        flight_times_anom = np.random.normal(
            baseline['flight_time_base'], 
            baseline['flight_time_std'] * anomaly_factor, 
            n_anomaly
        )
        flight_times = np.concatenate([flight_times, flight_times_anom])
        
        mouse_speeds_anom = np.random.normal(
            baseline['mouse_speed_base'], 
            baseline['mouse_speed_std'] * anomaly_factor, 
            n_anomaly
        )
        mouse_speeds = np.concatenate([mouse_speeds, mouse_speeds_anom])
        
        mouse_accelerations = np.concatenate([
            mouse_accelerations, 
            np.random.gamma(5, 1.0, n_anomaly)  # Higher acceleration
        ])
        
        click_frequencies = np.concatenate([
            click_frequencies,
            np.random.poisson(baseline['click_freq_base'] * 2, n_anomaly)  # More clicks
        ])
        
        latencies = np.concatenate([
            latencies,
            np.random.normal(baseline['latency_base'] * 2, 20, n_anomaly)  # Higher latency
        ])
        
        app_switches = np.concatenate([
            app_switches,
            np.random.poisson(3.0, n_anomaly)  # More app switches
        ])
        
        idle_ratios = np.concatenate([
            idle_ratios,
            np.random.beta(8, 2, n_anomaly)  # More idle time
        ])
        
        active_times = np.concatenate([
            active_times,
            np.random.exponential(45, n_anomaly)  # Longer sessions
        ])
    
    # Create DataFrame with feature schema
    features = {
        'typing_speed_avg': typing_speeds,
        'typing_speed_std': np.abs(np.random.normal(0, 5, n_samples)),
        'hold_time_avg': hold_times,
        'hold_time_std': np.abs(np.random.normal(0, 10, n_samples)),
        'flight_time_avg': flight_times,
        'flight_time_std': np.abs(np.random.normal(0, 20, n_samples)),
        'mouse_speed_avg': mouse_speeds,
        'mouse_speed_std': np.abs(np.random.normal(0, 30, n_samples)),
        'mouse_acceleration_avg': mouse_accelerations,
        'click_frequency': click_frequencies,
        'app_switches_per_min': app_switches,
        'network_latency_avg': latencies,
        'network_latency_std': np.abs(np.random.normal(0, 5, n_samples)),
        'idle_time_ratio': idle_ratios,
        'active_time_minutes': active_times
    }
    
    # Ensure all arrays have the same length
    for key, values in features.items():
        if len(values) != n_samples:
            features[key] = np.resize(values, n_samples)
    
    df = pd.DataFrame(features)
    
    # Add metadata columns
    df['user_type'] = user_type
    df['is_anomaly'] = np.concatenate([
        np.zeros(n_normal, dtype=bool),
        np.ones(n_anomaly, dtype=bool)
    ])
    
    # Shuffle the data
    df = df.sample(frac=1).reset_index(drop=True)
    
    return df

def main():
    parser = argparse.ArgumentParser(description='Generate synthetic behavioral training data')
    parser.add_argument('--output', '-o', default='sample_data.csv', help='Output CSV file')
    parser.add_argument('--samples', '-n', type=int, default=1000, help='Number of samples')
    parser.add_argument('--user-type', choices=['normal', 'fast_typer', 'slow_careful'], 
                       default='normal', help='User behavior type')
    parser.add_argument('--anomaly-rate', type=float, default=0.05, 
                       help='Proportion of anomalous samples')
    
    args = parser.parse_args()
    
    print(f"Generating {args.samples} samples of type '{args.user_type}' with {args.anomaly_rate*100}% anomalies...")
    
    # Generate data
    df = generate_sample_data(
        n_samples=args.samples,
        user_type=args.user_type,
        anomaly_rate=args.anomaly_rate
    )
    
    # Save to CSV
    df.to_csv(args.output, index=False)
    
    print(f"✅ Generated data saved to {args.output}")
    print(f"📊 Shape: {df.shape}")
    print(f"🎯 Anomalies: {df['is_anomaly'].sum()} ({df['is_anomaly'].mean()*100:.1f}%)")
    print(f"\n📋 Feature statistics:")
    print(df.describe())

if __name__ == "__main__":
    main()