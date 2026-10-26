'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  LayoutDashboard,
  Store,
  Receipt,
  Boxes,
  MoreHorizontal,
  BarChart3,
  UtensilsCrossed,
  Wallet,
  Users,
  Settings,
  LogOut,
  X,
} from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { profile, isAdmin, signOut } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const mainTabs = [
    { name: 'Ringkasan', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Kasir', href: '/pos', icon: Store },
    { name: 'Transaksi', href: '/transactions', icon: Receipt },
    { name: 'Stok', href: '/inventory', icon: Boxes },
  ];

  const adminMoreTabs = [
    { name: 'Laporan Keuangan', href: '/reports', icon: BarChart3 },
    { name: 'Menu & Resep', href: '/menu', icon: UtensilsCrossed },
    { name: 'Pengeluaran', href: '/expenses', icon: Wallet },
    { name: 'Pengguna', href: '/users', icon: Users },
    { name: 'Pengaturan', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* More Drawer Modal for Mobile */}
      {isMoreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-t-ios-sheet p-5 border-t border-border shadow-ios-modal max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-foreground">Menu Tambahan</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-muted">
                  {profile?.role === 'admin' ? 'Admin' : 'Kasir'}
                </span>
              </div>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1 rounded-full text-muted hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isAdmin && (
              <div className="space-y-1 mb-5">
                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
                  Manajemen Toko
                </p>
                {adminMoreTabs.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-ios text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-nyeni-blue-soft text-nyeni-blue'
                          : 'text-foreground hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-nyeni-blue" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  signOut();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-ios bg-rose-50 text-rose-600 font-semibold text-sm hover:bg-rose-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Akun ({profile?.full_name})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Nav Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-border px-2 py-1.5 flex items-center justify-around shadow-ios pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] min-w-[44px] transition-colors ${
                isActive ? 'text-nyeni-blue' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-semibold mt-0.5">{tab.name}</span>
            </Link>
          );
        })}

        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] min-w-[44px] transition-colors ${
            isMoreOpen ? 'text-nyeni-blue' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[11px] font-semibold mt-0.5">Lainnya</span>
        </button>
      </nav>
    </>
  );
}
