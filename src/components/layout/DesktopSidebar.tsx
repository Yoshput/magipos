'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  LayoutDashboard,
  Store,
  Receipt,
  Boxes,
  BarChart3,
  UtensilsCrossed,
  Wallet,
  Users,
  Settings,
  LogOut,
  ShieldAlert,
} from 'lucide-react';

export function DesktopSidebar() {
  const pathname = usePathname();
  const { profile, isAdmin, signOut } = useAuth();

  const cashierNav = [
    { name: 'Kasir (POS)', href: '/pos', icon: Store },
    { name: 'Riwayat Transaksi', href: '/transactions', icon: Receipt },
  ];

  const adminMainNav = [
    { name: 'Ringkasan Eksekutif', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Kasir (POS)', href: '/pos', icon: Store },
    { name: 'Transaksi & Void', href: '/transactions', icon: Receipt },
    { name: 'Stok Bahan Baku', href: '/inventory', icon: Boxes },
  ];

  const adminNav = [
    { name: 'Laporan Finansial', href: '/reports', icon: BarChart3 },
    { name: 'Menu & Resep Takaran', href: '/menu', icon: UtensilsCrossed },
    { name: 'Pengeluaran Operasional', href: '/expenses', icon: Wallet },
    { name: 'Kelola Akun Kasir', href: '/users', icon: Users },
    { name: 'Pengaturan & Backup', href: '/settings', icon: Settings },
  ];

  const navItems = isAdmin ? adminMainNav : cashierNav;

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-border h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-border flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-nyeni-navy/5 flex items-center justify-center p-1 border border-nyeni-blue/10">
          <Image
            src="/assets/logo-mango-nyeni.png"
            alt="Mango Nyeni Logo"
            width={40}
            height={40}
            className="object-contain"
            priority
          />
        </div>
        <div>
          <h1 className="text-base font-extrabold text-nyeni-navy tracking-tight">NyeniPOS</h1>
          <p className="text-xs font-semibold text-nyeni-mango tracking-wider uppercase">Mango Nyeni</p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
            {isAdmin ? 'Menu Operasional' : 'Menu Kasir'}
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-ios text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-nyeni-blue-soft text-nyeni-blue'
                      : 'text-muted hover:text-foreground hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-nyeni-blue' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {isAdmin && (
          <div>
            <p className="px-3 text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
              Manajemen Admin
            </p>
            <nav className="space-y-1">
              {adminNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-ios text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-nyeni-blue-soft text-nyeni-blue'
                        : 'text-muted hover:text-foreground hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-nyeni-blue' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-border bg-slate-50/50">
        <div className="flex items-center justify-between p-2 rounded-ios bg-white border border-border shadow-xs">
          <div className="min-w-0 flex-1 mr-2">
            <p className="text-sm font-bold text-foreground truncate">
              {profile?.full_name || 'Petugas'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isAdmin ? 'bg-amber-500' : 'bg-nyeni-blue'
                }`}
              />
              <span className="text-xs font-medium text-muted">
                @{profile?.username || (isAdmin ? 'admin' : 'kasir')} &bull; {isAdmin ? 'Admin' : 'Kasir'}
              </span>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            title="Keluar"
            className="p-2 text-muted hover:text-rose-600 hover:bg-rose-50 rounded-ios transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
