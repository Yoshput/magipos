'use client';

import React from 'react';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { OfflineBanner } from '@/components/ui/ConnectionStatus';
import { useAuth } from '@/context/auth-context';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isLoading, isConfigured } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-8 rounded-ios-card border border-border shadow-ios text-center">
          <div className="w-12 h-12 border-4 border-nyeni-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-base font-bold text-nyeni-navy">Memuat NyeniPOS...</h2>
          <p className="text-xs text-muted mt-1">Menyiapkan sesi & sistem operasional</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      <OfflineBanner />

      <div className="flex-1 flex w-full">
        <DesktopSidebar />

        <main className="flex-1 min-w-0 flex flex-col pb-20 lg:pb-8">
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
