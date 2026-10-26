'use client';

import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  requireReason?: boolean;
  reasonPlaceholder?: string;
  isLoading?: boolean;
  onConfirm: (reason?: string) => void;
  onClose: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  variant = 'danger',
  requireReason = false,
  reasonPlaceholder = 'Tuliskan alasan tindakan ini...',
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setError('Alasan wajib diisi.');
      return;
    }
    setError('');
    onConfirm(reason.trim());
  };

  const buttonStyles = {
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    primary: 'bg-nyeni-blue hover:bg-nyeni-blue-hover text-white',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-ios-card shadow-ios-modal border border-border p-6 overflow-hidden">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                variant === 'danger'
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-amber-100 text-amber-600'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-full text-muted hover:text-foreground hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted mb-4">{description}</p>

        {requireReason && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Alasan Pembatalan / Tindakan <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              rows={3}
              placeholder={reasonPlaceholder}
              className="w-full px-3 py-2 text-sm rounded-ios border border-border focus:outline-none focus:ring-2 focus:ring-nyeni-blue/30 focus:border-nyeni-blue"
            />
            {error && <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-ios border border-border text-foreground hover:bg-slate-50 text-sm font-semibold transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-ios text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 ${buttonStyles[variant]}`}
          >
            {isLoading ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
