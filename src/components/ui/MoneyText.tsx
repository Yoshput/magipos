import React from 'react';
import { formatRupiah } from '@/lib/format';

interface MoneyTextProps {
  amount: number | null | undefined;
  className?: string;
  size?: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
}

export function MoneyText({ amount, className = '', size = 'base' }: MoneyTextProps) {
  const sizeClasses = {
    sm: 'text-sm font-medium',
    base: 'text-base font-semibold',
    lg: 'text-lg font-bold',
    xl: 'text-xl font-bold',
    '2xl': 'text-2xl font-black',
  };

  return (
    <span className={`tabular-nums tracking-tight ${sizeClasses[size]} ${className}`}>
      {formatRupiah(amount)}
    </span>
  );
}
