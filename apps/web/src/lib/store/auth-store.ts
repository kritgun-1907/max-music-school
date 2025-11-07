// apps/web/src/lib/store/auth-store.ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher';
  contact?: string;
  status?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  initialize: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      initialize: () => {
        // Check if user data exists in localStorage
        const storedData = localStorage.getItem('auth-storage');
        if (storedData) {
          try {
            const parsed = JSON.parse(storedData);
            if (parsed.state?.user && parsed.state?.accessToken) {
              set({ 
                user: parsed.state.user,
                accessToken: parsed.state.accessToken,
                refreshToken: parsed.state.refreshToken,
                isAuthenticated: true,
                isLoading: false 
              });
              return;
            }
          } catch (error) {
            console.error('Failed to parse stored auth data:', error);
            localStorage.removeItem('auth-storage');
          }
        }
        set({ isLoading: false });
      },

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          
          // TODO: Replace with actual API call
          const mockUser: User = {
            id: '1',
            name: 'Test User',
            email: email,
            role: email.includes('teacher') ? 'teacher' : 'student',
          };

          const mockAccessToken = 'mock-access-token';
          const mockRefreshToken = 'mock-refresh-token';

          set({ 
            user: mockUser,
            accessToken: mockAccessToken,
            refreshToken: mockRefreshToken,
            isAuthenticated: true,
            isLoading: false 
          });
        } catch (error) {
          console.error('Login failed:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ 
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false 
        });
        localStorage.removeItem('auth-storage');
      },

      setUser: (user: User | null) => {
        set({ 
          user, 
          isAuthenticated: !!user 
        });
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({ 
          accessToken,
          refreshToken 
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);