// apps/mobile/src/services/api.ts
import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Clear tokens and redirect to login
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        // You can emit an event here to trigger navigation to login
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ===========================
// AUTH SERVICE
// ===========================

export const authService = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data;
    
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  },

  getCurrentUser: async () => {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

// ===========================
// STUDENT SERVICE
// ===========================

export const studentService = {
  getDashboard: () => apiClient.get('/student/dashboard'),
  
  getProfile: () => apiClient.get('/student/profile'),
  
  updateProfile: (data: any) => apiClient.put('/student/profile', data),
  
  requestBatchChange: (data: {
    currentBatchDay: string;
    currentBatchTime: string;
    requestedBatchDay: string;
    requestedBatchTime: string;
    reason: string;
  }) => apiClient.post('/student/batch-change-request', data),
  
  getBatchChangeRequests: () => apiClient.get('/student/batch-change-requests'),
};

// ===========================
// PRACTICE TOOLS SERVICE
// ===========================

export const practiceToolsService = {
  getChords: () => apiClient.get('/practice-tools/chords'),
  
  getChordByName: (name: string) => apiClient.get(`/practice-tools/chords/${name}`),
  
  saveMetronomeSettings: (settings: any) => 
    apiClient.post('/practice-tools/metronome-settings', settings),
  
  getMetronomeSettings: () => apiClient.get('/practice-tools/metronome-settings'),
  
  saveTunerSettings: (settings: any) => 
    apiClient.post('/practice-tools/tuner-settings', settings),
  
  getTunerSettings: () => apiClient.get('/practice-tools/tuner-settings'),
};

// ===========================
// NOTIFICATIONS SERVICE
// ===========================

export const notificationsService = {
  registerDevice: (deviceToken: string) => 
    apiClient.post('/notifications/register', { deviceToken }),
  
  getNotifications: (limit = 20, offset = 0) => 
    apiClient.get('/notifications', { params: { limit, offset } }),
  
  markAsRead: (notificationId: string) => 
    apiClient.put(`/notifications/${notificationId}/read`),
  
  markAllAsRead: () => apiClient.put('/notifications/read-all'),
};

// ===========================
// EXPORT DEFAULT API CLIENT
// ===========================

export default apiClient;

// ===========================
// TYPE DEFINITIONS
// ===========================

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher';
  phone?: string;
}

export interface StudentDashboard {
  name: string;
  email: string;
  phone: string;
  batchDay: string;
  batchTime: string;
  monthlyFees: string;
  paymentStatus: string;
  attendance: number;
  totalClasses: number;
  attendancePercentage: number;
}

export interface BatchChangeRequest {
  id: string;
  studentName: string;
  currentBatchDay: string;
  currentBatchTime: string;
  requestedBatchDay: string;
  requestedBatchTime: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Chord {
  name: string;
  positions: number[];
  fingers: number[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}
