import React from 'react';

export function LoadingSkeleton({ className = '', count = 1 }: { className?: string; count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-slate-200/80 rounded-ios ${className}`}
        />
      ))}
    </>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 p-4 bg-white rounded-ios border border-slate-100">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-4 bg-slate-200 rounded flex-1 animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}
