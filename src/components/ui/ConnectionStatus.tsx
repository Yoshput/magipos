'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <Wifi className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Online</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 animate-bounce">
      <WifiOff className="w-3.5 h-3.5" />
      <span>Offline (Hanya Lihat)</span>
    </div>
  );
}

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="w-full bg-rose-600 text-white text-xs sm:text-sm font-semibold py-2.5 px-4 text-center flex items-center justify-center gap-2 shadow-md sticky top-0 z-50">
      <WifiOff className="w-4 h-4 animate-pulse" />
      <span>Koneksi internet terputus. Transaksi baru ditahan sampai koneksi kembali stabil.</span>
    </div>
  );
}
