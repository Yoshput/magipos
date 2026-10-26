import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Terjadi Kesalahan',
  message,
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`p-6 text-center bg-rose-50/70 border border-rose-200 rounded-ios-card shadow-sm ${className}`}
    >
      <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-rose-950 mb-1">{title}</h3>
      <p className="text-sm text-rose-700 max-w-md mx-auto mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-ios text-sm font-semibold hover:bg-rose-700 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      )}
    </div>
  );
}
