'use client';

import React, { useState, useEffect } from 'react';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { LogoutConfirmModal } from './LogoutConfirmModal';
import { FeatureTourModal } from '@/components/guide/FeatureTourModal';
import { OfflineBanner } from '@/components/ui/ConnectionStatus';
import { useAuth } from '@/context/auth-context';
import { localDb } from '@/lib/storage/local-db';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { HelpCircle } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isLoading, isConfigured, isLogoutModalOpen, closeLogoutModal, signOut, profile } =
    useAuth();
  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    // Check if first-time user
    if (typeof window !== 'undefined') {
      const viewed = window.localStorage.getItem('nyeni_tour_viewed');
      if (!viewed) {
        // Auto open tour smoothly on first visit
        const timer = setTimeout(() => setIsTourOpen(true), 800);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  useEffect(() => {
    // Listen for custom trigger to open tour
    const handleOpenTour = () => setIsTourOpen(true);
    window.addEventListener('nyeni_open_tour', handleOpenTour);
    return () => window.removeEventListener('nyeni_open_tour', handleOpenTour);
  }, []);

  // Client-side authentication guard
  useEffect(() => {
    if (!isLoading && !profile) {
      window.location.href = '/login';
    }
  }, [isLoading, profile]);

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

      {/* Floating Tour Guide Trigger Button */}
      <button
        type="button"
        onClick={() => setIsTourOpen(true)}
        className="fixed bottom-20 lg:bottom-6 right-5 z-40 bg-white/95 hover:bg-white text-nyeni-navy border border-slate-200/90 shadow-ios-float px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-2 backdrop-blur-md transition-all hover:scale-105 active:scale-95"
        title="Buka Panduan Fitur Sistem"
      >
        <span className="w-2 h-2 rounded-full bg-nyeni-blue animate-pulse" />
        <HelpCircle className="w-4 h-4 text-nyeni-blue" />
        <span className="hidden sm:inline">Panduan Fitur</span>
      </button>

      {/* Interactive Step-by-Step Feature Tour */}
      <FeatureTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />

      {/* Global Logout Modal: Single instance, immune to stacking contexts */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        profile={profile}
        onClose={closeLogoutModal}
        onConfirm={(remember) => {
          if (!remember) {
            localDb.clearRememberedUser();
          }
          closeLogoutModal();
          signOut();
        }}
      />
    </div>
  );
}
