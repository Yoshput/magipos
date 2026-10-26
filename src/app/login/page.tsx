'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Shield, Store, Check } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Email dan password wajib diisi.');
      return;
    }

    setIsLoading(true);

    const success = login(email.trim(), password);
    if (!success) {
      setErrorMessage('Email atau password salah. Silakan coba kembali.');
      setIsLoading(false);
      return;
    }

    router.push('/pos');
  };

  const fillQuickAccount = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 select-none">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white border border-border shadow-ios p-2 mb-3">
            <Image
              src="/assets/logo-mango-nyeni.png"
              alt="Mango Nyeni Logo"
              width={70}
              height={70}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-black text-nyeni-navy tracking-tight">NyeniPOS</h1>
          <p className="text-xs font-bold text-nyeni-mango tracking-widest uppercase mt-0.5">
            Sistem Kasir & Operasional Mandiri
          </p>
        </div>

        {/* Quick Credentials Info Box */}
        <div className="mb-4 bg-white p-4 rounded-ios-card border border-nyeni-blue/20 shadow-ios space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-nyeni-navy uppercase tracking-wider">
              Akun Siap Pakai (Standalone Mode)
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              Auto Active
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillQuickAccount('admin@mangonyeni.com', 'admin123')}
              className="p-2.5 rounded-ios border border-amber-200 bg-amber-50/70 hover:bg-amber-100/70 text-left transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                <span>Akun Admin</span>
              </div>
              <p className="text-[11px] text-amber-800 font-mono mt-1">admin@mangonyeni.com</p>
              <p className="text-[10px] text-muted">Pass: <strong>admin123</strong> (Klik isi)</p>
            </button>

            <button
              type="button"
              onClick={() => fillQuickAccount('kasir@mangonyeni.com', 'kasir123')}
              className="p-2.5 rounded-ios border border-nyeni-blue/30 bg-nyeni-blue-soft/70 hover:bg-nyeni-blue-soft text-left transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 font-bold text-nyeni-navy">
                <Store className="w-3.5 h-3.5 text-nyeni-blue" />
                <span>Akun Kasir</span>
              </div>
              <p className="text-[11px] text-nyeni-blue font-mono mt-1">kasir@mangonyeni.com</p>
              <p className="text-[10px] text-muted">Pass: <strong>kasir123</strong> (Klik isi)</p>
            </button>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-ios-card border border-border shadow-ios-float p-6 sm:p-7">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-foreground">Masuk Sistem</h2>
            <p className="text-xs text-muted mt-0.5">
              Gunakan email & password di atas untuk masuk ke aplikasi.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-ios bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mangonyeni.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-ios border border-border bg-slate-50/50 text-foreground focus:outline-none focus:ring-2 focus:ring-nyeni-blue/30 focus:border-nyeni-blue transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-ios border border-border bg-slate-50/50 text-foreground focus:outline-none focus:ring-2 focus:ring-nyeni-blue/30 focus:border-nyeni-blue transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 min-h-[46px] rounded-ios bg-nyeni-navy text-white font-bold text-sm hover:bg-nyeni-navy-hover transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-2"
            >
              <span>Masuk Sekarang</span>
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-muted mt-6">
          &copy; {new Date().getFullYear()} Mango Nyeni. Hak Cipta Dilindungi.
        </p>
      </div>
    </div>
  );
}
