import React from 'react';
import { ConnectionStatus, StorageModeBadge } from '@/components/ui/ConnectionStatus';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action, children }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-extrabold text-nyeni-navy tracking-tight">
            {title}
          </h1>
          <ConnectionStatus />
          <StorageModeBadge />
        </div>
        {subtitle && <p className="text-xs sm:text-sm text-muted mt-1">{subtitle}</p>}
      </div>

      {(action || children) && (
        <div className="flex items-center gap-3 flex-wrap">
          {children}
          {action}
        </div>
      )}
    </div>
  );
}
