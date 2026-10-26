'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import { useNotification } from '@/context/notification-context';
import {
  Eye,
  EyeOff,
  Lock,
  User,
  Shield,
  Store,
  ArrowRight,
  Sparkles,
  Loader2,
  ArrowLeft,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { notify } = useNotification();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim() || !password) {
      setErrorMessage('Username/email dan password wajib diisi.');
      return;
    }

    setIsLoading(true);

    const success = login(identifier.trim(), password);
    if (!success) {
      setErrorMessage('Username atau password tidak cocok. Silakan periksa kembali.');
      setIsLoading(false);
      return;
    }

    const clean = identifier.toLowerCase().trim();
    const isAdminUser = clean === 'admin' || clean.startsWith('admin@');

    notify({
      type: 'success',
      title: isAdminUser ? 'Selamat Datang, Admin!' : 'Selamat Datang, Kasir!',
      message: isAdminUser
        ? 'Mengarahkan ke ringkasan operasional toko...'
        : 'Sesi kasir aktif. Siap melayani pelanggan.',
    });

    setTimeout(() => {
      if (isAdminUser) {
        router.push('/dashboard');
      } else {
        router.push('/pos');
      }
    }, 300);
  };

  const fillQuickAccount = (quickUser: string, quickPass: string) => {
    setIdentifier(quickUser);
    setPassword(quickPass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center p-4 selection:bg-nyeni-blue selection:text-white select-none">
      {/* Real Blue Sky Clouds Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <Image
          src="/assets/real-clouds-bg-lg.webp"
          alt="Real Blue Sky with White Clouds"
          fill
          priority
          className="object-cover object-center scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-sky-50/50 to-white/80 backdrop-blur-[1px]" />
      </div>

      {/* Back to Landing Page link */}
      <div className="relative z-10 w-full max-w-md mb-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-nyeni-navy bg-white/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/60 shadow-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Halaman Depan</span>
        </Link>
      </div>

      {/* Main Glassmorphism Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="relative z-10 w-full max-w-md backdrop-blur-2xl bg-white/85 border border-white/70 rounded-[28px] p-6 sm:p-8 shadow-[0_20px_60px_rgba(20,42,114,0.12)]"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white border border-nyeni-blue/20 shadow-md p-2 mb-3">
            <Image
              src="/assets/logo-mango-nyeni-sm.webp"
              alt="Mango Nyeni Logo"
              width={70}
              height={70}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-black text-nyeni-navy tracking-tight">NyeniPOS</h1>
          <p className="text-[11px] font-bold text-nyeni-blue tracking-widest uppercase mt-0.5">
            Portal Masuk Kasir & Manajemen
          </p>
        </div>

        {/* 1-Click Quick Credentials Buttons */}
        <div className="mb-5 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-nyeni-mango" />
              <span>1-Klik Isi Cepat Akun:</span>
            </span>
            <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              Auto Active
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Quick Kasir Button */}
            <button
              type="button"
              onClick={() => fillQuickAccount('kasir_yossika', 'kasirsukses2026')}
              className="p-2.5 rounded-xl border border-nyeni-blue/30 bg-nyeni-blue-soft/70 hover:bg-nyeni-blue-soft text-left transition-colors flex flex-col justify-between group"
            >
              <div className="flex items-center gap-1.5 font-bold text-nyeni-navy">
                <Store className="w-3.5 h-3.5 text-nyeni-blue" />
                <span>Kasir (Yossika)</span>
              </div>
              <p className="text-[10px] text-nyeni-blue font-mono font-bold mt-1">@kasir_yossika</p>
              <p className="text-[9px] text-muted">Pw: kasirsukses2026</p>
            </button>

            {/* Quick Admin Button */}
            <button
              type="button"
              onClick={() => fillQuickAccount('admin', 'admin123')}
              className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100/70 text-left transition-colors flex flex-col justify-between group"
            >
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                <span>Admin (Owner)</span>
              </div>
              <p className="text-[10px] text-amber-800 font-mono font-bold mt-1">@admin</p>
              <p className="text-[9px] text-muted">Pw: admin123</p>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-nyeni-navy mb-1.5">
              Username atau Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Contoh: kasir_yossika atau admin"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-nyeni-blue/30 focus:border-nyeni-blue transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-nyeni-navy mb-1.5">
              Kata Sandi (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-nyeni-blue/30 focus:border-nyeni-blue transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-nyeni-navy hover:bg-nyeni-blue text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <span>Masuk ke Sistem</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-5 text-[11px] text-center text-slate-500 font-medium">
          NyeniPOS Standalone Engine &bull; Enkripsi Sesi Browser Lokal
        </p>
      </motion.div>
    </div>
  );
}
