'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X, Loader2, CheckCircle2 } from 'lucide-react';
import { Profile } from '@/types';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  profile: Profile | null;
  onClose: () => void;
  onConfirm: (remember: boolean) => void;
}

export function LogoutConfirmModal({
  isOpen,
  profile,
  onClose,
  onConfirm,
}: LogoutConfirmModalProps) {
  const [mounted, setMounted] = useState(false);
  const [rememberAccount, setRememberAccount] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onConfirm(rememberAccount);
    }, 350);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: 'spring', damping: 28, stiffness: 360 }}
            className="w-full max-w-sm bg-white rounded-[26px] border border-slate-200/80 shadow-[0_25px_60px_rgba(20,42,114,0.22)] overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 pb-0 flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-2xs">
                <LogOut className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="p-1.5 rounded-full text-muted hover:text-foreground hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 pt-3">
              <h3 className="text-base font-black text-foreground tracking-tight">
                Keluar dari Sistem NyeniPOS?
              </h3>
              <p className="text-xs text-muted mt-1.5 leading-relaxed font-medium">
                Hai <strong className="text-foreground">{profile?.full_name || 'Petugas'}</strong>,
                seluruh data transaksi, mutasi bahan, dan laporan keuangan telah tersimpan aman di database browser.
              </p>

              {/* Remember Toggle */}
              <label
                htmlFor="remember_logout"
                className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3 cursor-pointer select-none hover:bg-slate-100/70 transition-colors"
              >
                <input
                  id="remember_logout"
                  type="checkbox"
                  checked={rememberAccount}
                  onChange={(e) => setRememberAccount(e.target.checked)}
                  disabled={isProcessing}
                  className="w-4 h-4 rounded text-nyeni-blue border-slate-300 focus:ring-nyeni-blue cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Simpan pengingat akun untuk login cepat berikutnya
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="p-5 pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/40">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-75"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Menyimpan Sesi...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Ya, Keluar Akun</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
