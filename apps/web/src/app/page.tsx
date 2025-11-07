// apps/web/src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
    
    if (isAuthenticated && user) {
      // Redirect based on role
      if (user.role === 'student') {
        router.push('/student/dashboard');
      } else if (user.role === 'teacher') {
        router.push('/teacher/dashboard');
      }
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, user, router, initialize]);

  return (
    <div className="min-h-screen flex items-center justify-center gradient-warm">
      <div className="spinner"></div>
    </div>
  );
}