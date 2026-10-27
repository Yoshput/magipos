'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('NyeniPOS Service Worker active with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('SW registration failed:', err);
        });
    }

    // 2. Check if already running in standalone mode (installed PWA)
    if (
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true)
    ) {
      setIsInstalled(true);
      return;
    }

    // 3. Detect iOS Safari
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIos(isIosDevice);
    }

    // 4. Capture beforeinstallprompt on Android / Chromium
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Only show if not dismissed recently
      const dismissed = window.localStorage.getItem('nyeni_pwa_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('nyeni_pwa_dismissed', 'true');
    }
  };

  return (
    <>
      {children}

      {/* Chromium / Android Install Banner */}
      {showInstallBanner && !isInstalled && (
        <div className="fixed bottom-20 lg:bottom-5 left-4 right-4 max-w-sm mx-auto z-40 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-nyeni-blue/30 shadow-[0_10px_35px_rgba(20,42,114,0.18)] flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-nyeni-blue text-white flex items-center justify-center shrink-0 shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-nyeni-navy truncate">Pasang Aplikasi NyeniPOS</p>
              <p className="text-[11px] text-slate-500 truncate">Akses cepat tanpa browser bar</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl bg-nyeni-navy hover:bg-nyeni-blue text-white text-xs font-bold transition-all shadow-xs"
            >
              Pasang
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* iOS Safari Home Screen Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-xs w-full bg-white rounded-3xl p-5 border border-slate-200 shadow-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-nyeni-blue-soft text-nyeni-blue mx-auto flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-nyeni-navy">Pasang di iPhone / iPad</h3>
            <div className="text-xs text-slate-600 space-y-2 text-left bg-slate-50 p-3 rounded-2xl border border-slate-100 font-medium">
              <p>1. Ketuk tombol <strong>Bagikan (Share)</strong> di bilah bawah Safari.</p>
              <p>2. Gulir ke bawah dan pilih <strong>&quot;Tambah ke Layar Utama&quot; (Add to Home Screen)</strong>.</p>
              <p>3. Ketuk <strong>Tambah</strong> di kanan atas.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-nyeni-navy text-white text-xs font-bold"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
