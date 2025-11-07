// apps/web/src/lib/api.ts
import axios, { AxiosError, AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            this.logout();
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );

    // Load tokens from localStorage on init
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
    }
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) return null;

    try {
      const response = await axios.post(`${API_URL}/api/auth/refresh`, {
        refreshToken: this.refreshToken,
      });

      const { accessToken } = response.data;
      this.accessToken = accessToken;

      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', accessToken);
      }

      return accessToken;
    } catch (error) {
      return null;
    }
  }

  logout() {
    this.accessToken = null;
    this.refreshToken = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  // Authentication
  async teacherLogin(email: string, password: string) {
    const response = await this.client.post('/api/teacher/login', {
      email,
      password,
    });

    const { accessToken, refreshToken, user } = response.data;
    this.setTokens(accessToken, refreshToken);

    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }

    return response.data;
  }

  // Teacher Dashboard
  async getTeacherDashboard() {
    const response = await this.client.get('/api/teacher/dashboard');
    return response.data;
  }

  async getTeacherBatches() {
    const response = await this.client.get('/api/teacher/batches');
    return response.data;
  }

  async getBatchStudents(batchName: string) {
    const response = await this.client.get(
      `/api/teacher/batches/${encodeURIComponent(batchName)}/students`
    );
    return response.data;
  }

  async markAttendance(data: {
    batchName: string;
    date: string;
    students: Array<{ studentId: string; name: string; status: 'present' | 'absent' }>;
  }) {
    const response = await this.client.post('/api/teacher/attendance', data);
    return response.data;
  }

  async getAttendanceHistory(batchName: string, month?: number, year?: number) {
    const params = new URLSearchParams();
    params.append('batchName', batchName);
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());

    const response = await this.client.get(`/api/teacher/attendance/history?${params}`);
    return response.data;
  }

  async getPendingRequests() {
    const response = await this.client.get('/api/teacher/requests');
    return response.data;
  }

  async approveRequest(requestId: string, updates: any) {
    const response = await this.client.post(`/api/teacher/requests/${requestId}/approve`, {
      updates,
    });
    return response.data;
  }

  async getStatistics() {
    const response = await this.client.get('/api/teacher/statistics');
    return response.data;
  }

  async addStudent(studentData: any) {
    const response = await this.client.post('/api/teacher/add-student', studentData);
    return response.data;
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const api = new ApiClient();
export default api;