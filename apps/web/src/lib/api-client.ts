// apps/web/src/lib/api-client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: any;
}

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // If error is 401 and we have a refresh token, try to refresh
        if (error.response?.status === 401 && !originalRequest._retry && this.refreshToken) {
          originalRequest._retry = true;

          try {
            const response = await axios.post(`${API_URL}/api/auth/refresh`, {
              refreshToken: this.refreshToken,
            });

            const { accessToken } = response.data;
            this.setAccessToken(accessToken);

            // Retry original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout user
            this.clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      return {
        message: (error.response.data as any)?.error || 'An error occurred',
        statusCode: error.response.status,
        errors: (error.response.data as any)?.details,
      };
    } else if (error.request) {
      return {
        message: 'No response from server',
        statusCode: 0,
      };
    } else {
      return {
        message: error.message || 'An error occurred',
        statusCode: 0,
      };
    }
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  }

  setRefreshToken(token: string) {
    this.refreshToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', token);
    }
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  loadTokens() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
    }
  }

  // Auth endpoints
  async login(email: string, password: string, role: 'student' | 'teacher') {
    const response = await this.client.post('/auth/login', {
      email,
      password,
      role,
    });
    const { accessToken, refreshToken, user } = response.data;
    this.setTokens(accessToken, refreshToken);
    return { user, accessToken, refreshToken };
  }

  async logout() {
    try {
      await this.client.post('/auth/logout');
    } finally {
      this.clearTokens();
    }
  }

  // Student endpoints
  async getStudentDashboard() {
    const response = await this.client.get('/student/dashboard');
    return response.data;
  }

  async getStudentProfile() {
    const response = await this.client.get('/student/profile');
    return response.data;
  }

  async updateStudentProfile(data: any) {
    const response = await this.client.put('/student/profile', data);
    return response.data;
  }

  async getStudentSchedule() {
    const response = await this.client.get('/student/schedule');
    return response.data;
  }

  async getStudentAttendance(month?: number, year?: number) {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    const response = await this.client.get(`/student/attendance?${params.toString()}`);
    return response.data;
  }

  async requestBatchChange(data: {
    newBatchName: string;
    newTiming: { from: string; till: string };
    newDays: string;
    reason?: string;
  }) {
    const response = await this.client.post('/student/request-change', data);
    return response.data;
  }

  async rateClass(data: { date: string; rating: number; feedback?: string }) {
    const response = await this.client.post('/student/rate-class', data);
    return response.data;
  }

  async getPaymentInfo() {
    const response = await this.client.get('/student/payment-info');
    return response.data;
  }

  async getUpcomingClasses() {
    const response = await this.client.get('/student/upcoming-classes');
    return response.data;
  }

  // Teacher endpoints
  async getTeacherDashboard() {
    const response = await this.client.get('/teacher/dashboard');
    return response.data;
  }

  async getTeacherBatches() {
    const response = await this.client.get('/teacher/batches');
    return response.data;
  }

  async getBatchStudents(batchName: string) {
    const response = await this.client.get(`/teacher/batches/${encodeURIComponent(batchName)}/students`);
    return response.data;
  }

  async markAttendance(data: {
    batchName: string;
    date: string;
    students: Array<{ studentId: string; name: string; status: 'present' | 'absent' }>;
  }) {
    const response = await this.client.post('/teacher/attendance', data);
    return response.data;
  }

  async getAttendanceHistory(batchName: string, month?: string, year?: string) {
    const params = new URLSearchParams({ batchName });
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    const response = await this.client.get(`/teacher/attendance/history?${params.toString()}`);
    return response.data;
  }

  async getPendingRequests() {
    const response = await this.client.get('/teacher/requests');
    return response.data;
  }

  async approveRequest(requestId: string, updates: any) {
    const response = await this.client.post(`/teacher/requests/${requestId}/approve`, { updates });
    return response.data;
  }

  async addStudent(data: any) {
    const response = await this.client.post('/teacher/add-student', data);
    return response.data;
  }

  async updateStudent(studentId: string, data: any) {
    const response = await this.client.put(`/teacher/students/${studentId}`, data);
    return response.data;
  }

  async getTeacherStatistics() {
    const response = await this.client.get('/teacher/statistics');
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Initialize tokens on load
if (typeof window !== 'undefined') {
  apiClient.loadTokens();
}