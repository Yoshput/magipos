import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'muted';

interface StatusBadgeProps {
  label: string;
  variant: StatusVariant;
  icon?: boolean;
  className?: string;
}

export function StatusBadge({ label, variant, icon = true, className = '' }: StatusBadgeProps) {
  const styles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    muted: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const icons = {
    success: <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />,
    warning: <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />,
    danger: <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />,
    info: <Clock className="w-3.5 h-3.5 mr-1 text-blue-600" />,
    muted: null,
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[variant]} ${className}`}
    >
      {icon && icons[variant]}
      {label}
    </span>
  );
}
