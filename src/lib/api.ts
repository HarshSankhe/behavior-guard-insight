import axios from 'axios';

// Base API configuration
const api = axios.create({
  baseURL: '/api', // This will be replaced with actual backend URL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Types for API responses
export interface RiskData {
  riskScore: number;
  timestamp: string;
  trend: 'up' | 'down' | 'stable';
}

export interface Alert {
  id: number;
  time: string;
  type: string;
  status: 'Resolved' | 'Unresolved' | 'Investigating';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description?: string;
}

export interface SessionEvent {
  time: string;
  event: string;
  severity: 'info' | 'warning' | 'danger';
  details?: string;
}

export interface UserProfile {
  username: string;
  typicalTypingSpeed: string;
  avgMouseSpeed: string;
  networkLatencyRange: string;
  lastLogin: string;
  deviceFingerprint: string;
  behaviorScore: number;
}

export interface SecuritySettings {
  sensitivity: 'Low' | 'Medium' | 'High';
  realTimeMonitoring: boolean;
  alertNotifications: boolean;
  anomalyDetection: boolean;
}

// Placeholder data for development
const placeholderRiskData: RiskData = {
  riskScore: 87,
  timestamp: new Date().toISOString(),
  trend: 'up'
};

const placeholderAlerts: Alert[] = [
  {
    id: 1,
    time: '2025-08-11T14:30:00Z',
    type: 'Anomaly Detected',
    status: 'Unresolved',
    severity: 'High',
    description: 'Unusual keystroke patterns detected'
  },
  {
    id: 2,
    time: '2025-08-11T12:15:00Z',
    type: 'Login from New Device',
    status: 'Resolved',
    severity: 'Medium',
    description: 'New device authentication completed'
  },
  {
    id: 3,
    time: '2025-08-11T10:45:00Z',
    type: 'Behavioral Deviation',
    status: 'Investigating',
    severity: 'Critical',
    description: 'Mouse movement patterns outside normal range'
  }
];

const placeholderSessions: SessionEvent[] = [
  { time: '14:25', event: 'Keystroke pattern deviation', severity: 'warning', details: 'Typing speed variance +15%' },
  { time: '14:20', event: 'Mouse speed anomaly', severity: 'danger', details: 'Movement speed 3x normal' },
  { time: '14:15', event: 'Normal session activity', severity: 'info', details: 'All parameters within range' },
  { time: '14:10', event: 'Authentication success', severity: 'info', details: 'Biometric match 98.7%' }
];

const placeholderUserProfile: UserProfile = {
  username: 'John Doe',
  typicalTypingSpeed: '65 WPM',
  avgMouseSpeed: '0.35 m/s',
  networkLatencyRange: '20-40 ms',
  lastLogin: '2025-08-11T14:30:00Z',
  deviceFingerprint: 'FP-4A7B9C2E',
  behaviorScore: 92.5
};

// API functions - these will connect to real backend later
export const authAPI = {
  login: async (username: string, password: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (username === 'admin' && password === 'security123') {
      const token = 'mock-jwt-token-' + Date.now();
      localStorage.setItem('auth_token', token);
      return { token, user: { username, role: 'admin' } };
    }
    throw new Error('Invalid credentials');
  },

  logout: async () => {
    localStorage.removeItem('auth_token');
    return { success: true };
  },

  checkAuth: () => {
    return !!localStorage.getItem('auth_token');
  }
};

export const dashboardAPI = {
  getRiskScore: async (): Promise<RiskData> => {
    // Simulate real-time data with some randomness
    await new Promise(resolve => setTimeout(resolve, 300));
    const baseScore = 87;
    const variance = Math.random() * 20 - 10; // ±10 variance
    const riskScore = Math.max(0, Math.min(100, baseScore + variance));
    
    return {
      ...placeholderRiskData,
      riskScore: Math.round(riskScore),
      timestamp: new Date().toISOString()
    };
  },

  getAlerts: async (): Promise<Alert[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return placeholderAlerts;
  },

  getSessionEvents: async (): Promise<SessionEvent[]> => {
    await new Promise(resolve => setTimeout(resolve, 150));
    return placeholderSessions;
  },

  markAlertResolved: async (alertId: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    // In real app, this would update the backend
    console.log(`Alert ${alertId} marked as resolved`);
  }
};

export const userAPI = {
  getProfile: async (): Promise<UserProfile> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return placeholderUserProfile;
  },

  updateProfile: async (profile: Partial<UserProfile>): Promise<UserProfile> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { ...placeholderUserProfile, ...profile };
  }
};

export const settingsAPI = {
  getSettings: async (): Promise<SecuritySettings> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      sensitivity: 'High',
      realTimeMonitoring: true,
      alertNotifications: true,
      anomalyDetection: true
    };
  },

  updateSettings: async (settings: Partial<SecuritySettings>): Promise<SecuritySettings> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const currentSettings = await settingsAPI.getSettings();
    return { ...currentSettings, ...settings };
  }
};

export default api;