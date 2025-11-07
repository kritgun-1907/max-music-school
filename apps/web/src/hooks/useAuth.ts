// apps/web/src/hooks/useAuth.ts
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';

export function useAuth(requiredRole?: 'student' | 'teacher') {
  const router = useRouter();
  const { user, isAuthenticated, logout, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      router.push('/login');
    }
  }, [isAuthenticated, user, requiredRole, router]);

  return {
    user,
    isAuthenticated,
    logout: () => {
      logout();
      router.push('/login');
    },
    isStudent: user?.role === 'student',
    isTeacher: user?.role === 'teacher',
  };
}