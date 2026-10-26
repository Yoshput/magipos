'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X, ShieldAlert } from 'lucide-react';
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
  const [rememberAccount, setRememberAccount] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onConfirm(rememberAccount);
    }, 200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-neutral-950/50 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="w-full max-w-sm bg-white rounded-[24px] border border-border shadow-[0_25px_60px_rgba(20,42,114,0.18)] overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 pb-0 flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
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
            <h3 className="text-base font-extrabold text-foreground tracking-tight">
              Keluar dari Sistem NyeniPOS?
            </h3>
            <p className="text-xs text-muted mt-1.5 leading-relaxed font-medium">
              Hai <strong className="text-foreground">{profile?.full_name || 'Petugas'}</strong>,
              seluruh catatan transaksi dan mutasi inventori kasir telah tersimpan aman di database
              lokal.
            </p>

            {/* Remember Toggle */}
            <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3 cursor-pointer select-none">
              <input
                id="remember_logout"
                type="checkbox"
                checked={rememberAccount}
                onChange={(e) => setRememberAccount(e.target.checked)}
                className="w-4 h-4 rounded text-nyeni-blue border-slate-300 focus:ring-nyeni-blue cursor-pointer"
              />
              <label htmlFor="remember_logout" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Simpan pengingat akun untuk login cepat berikutnya
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="p-5 pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-60"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Mengakhiri Sesi...' : 'Ya, Keluar Akun'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
