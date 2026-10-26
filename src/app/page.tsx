'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function RootPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace('/pos');
      } else {
        router.replace('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-10 h-10 border-4 border-nyeni-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
