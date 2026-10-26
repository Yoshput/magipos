import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-ios-card border border-border/80 shadow-ios ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-nyeni-blue-soft text-nyeni-blue flex items-center justify-center mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-foreground mb-1">{title}</h3>
      {description && <p className="text-sm text-muted max-w-sm mb-5">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-5 py-2.5 rounded-ios bg-nyeni-blue text-white text-sm font-semibold hover:bg-nyeni-blue-hover transition-colors shadow-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
