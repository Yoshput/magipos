'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import { useNotification } from '@/context/notification-context';
import { localDb, RememberedAccount } from '@/lib/storage/local-db';
import {
  Eye,
  EyeOff,
  Lock,
  User,
  Shield,
  Store,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  UserCheck,
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

  // Remembered Login State
  const [remembered, setRemembered] = useState<RememberedAccount | null>(null);
  const [showSwitchForm, setShowSwitchForm] = useState(false);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
  const [loginSuccessInfo, setLoginSuccessInfo] = useState<{
    name: string;
    role: string;
    targetRoute: string;
  } | null>(null);

  useEffect(() => {
    // Check if there is a remembered user in local storage
    const last = localDb.getRememberedUser();
    if (last) {
      setRemembered(last);
      setIdentifier(last.username);
    }
  }, []);

  const executeLogin = (userToLogin: string, passToLogin: string) => {
    setErrorMessage('');
    setIsLoading(true);

    const success = login(userToLogin.trim(), passToLogin);
    if (!success) {
      setErrorMessage('Username atau password tidak cocok. Silakan periksa kembali.');
      setIsLoading(false);
      setIsAutoLoggingIn(false);
      return;
    }

    const clean = userToLogin.toLowerCase().trim();
    const isAdminUser = clean === 'admin' || clean.startsWith('admin@');
    const targetUser = localDb.getSessionUser();
    const displayName =
      targetUser?.full_name || (isAdminUser ? 'Admin Owner' : 'Kasir Utama');

    setLoginSuccessInfo({
      name: displayName,
      role: isAdminUser ? 'Admin' : 'Kasir',
      targetRoute: isAdminUser ? '/dashboard' : '/pos',
    });

    notify({
      type: 'success',
      title: isAdminUser ? 'Selamat Datang, Admin' : 'Selamat Datang, Kasir',
      message: isAdminUser
        ? 'Mengarahkan ke ringkasan operasional toko...'
        : 'Sesi kasir aktif. Siap melayani pesanan.',
    });

    setTimeout(() => {
      if (isAdminUser) {
        router.push('/dashboard');
      } else {
        router.push('/pos');
      }
    }, 650);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMessage('Username dan password wajib diisi.');
      return;
    }
    executeLogin(identifier, password);
  };

  // Quick continue from remembered account
  const handleQuickContinue = () => {
    if (!remembered) return;
    setIsAutoLoggingIn(true);
    const pass = remembered.role === 'admin' ? 'admin123' : 'kasirsukses2026';
    setTimeout(() => {
      executeLogin(remembered.username, pass);
    }, 400);
  };

  const fillQuickAccount = (quickUser: string, quickPass: string) => {
    setIdentifier(quickUser);
    setPassword(quickPass);
    setErrorMessage('');
  };

  const handleForgetAccount = () => {
    localDb.clearRememberedUser();
    setRemembered(null);
    setShowSwitchForm(true);
    setIdentifier('');
    setPassword('');
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center p-4 selection:bg-nyeni-blue selection:text-white select-none">
      {/* Real Blue Sky Clouds Background (Fast 60fps) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <Image
          src="/assets/real-clouds-bg-fast.webp"
          alt="Latar Belakang Langit Biru Alami"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-sky-50/60 to-white/85" />
      </div>

      {/* Back to Landing Page link */}
      <div className="relative z-10 w-full max-w-md mb-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-nyeni-navy bg-white/90 px-3.5 py-1.5 rounded-full border border-white/80 shadow-xs transition-colors hover:shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Halaman Depan</span>
        </Link>
      </div>

      {/* Interactive Login Success Pop-up Animation */}
      <AnimatePresence>
        {loginSuccessInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 360 }}
              className="w-full max-w-sm bg-white rounded-[28px] p-6 text-center border border-slate-200/90 shadow-[0_25px_60px_rgba(20,42,114,0.25)] flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4 shadow-sm">
                <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase tracking-wider mb-2">
                Login Berhasil!
              </span>
              <h2 className="text-xl font-black text-nyeni-navy">
                Selamat Datang, {loginSuccessInfo.name}
              </h2>
              <p className="text-xs text-slate-600 mt-1.5 font-medium leading-relaxed">
                {loginSuccessInfo.role === 'Admin'
                  ? 'Menyiapkan portal ringkasan operasional toko...'
                  : 'Sesi kasir aktif. Menyiapkan katalog POS...'}
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-nyeni-blue">
                <Loader2 className="w-4 h-4 animate-spin text-nyeni-blue" />
                <span>Membuka halaman {loginSuccessInfo.role === 'Admin' ? 'Dashboard' : 'Kasir POS'}...</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Glassmorphic Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 340 }}
        className="relative z-10 w-full max-w-md backdrop-blur-2xl bg-white/90 border border-white/80 rounded-[26px] p-6 sm:p-8 shadow-[0_20px_50px_rgba(20,42,114,0.12)]"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-slate-200/80 shadow-xs p-1.5 mb-3">
            <Image
              src="/assets/logo-mango-nyeni-sm.webp"
              alt="Logo Mango Nyeni"
              width={54}
              height={54}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-black text-nyeni-navy tracking-tight">NyeniPOS</h1>
          <p className="text-[11px] font-bold text-nyeni-blue tracking-wider uppercase mt-0.5">
            Portal Masuk Kasir & Manajemen
          </p>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* VIEW A: PENGINGAT LOGIN (Jika Ada Akun Tersimpan Sebelumnya) */}
        {/* ----------------------------------------------------------- */}
        {remembered && !showSwitchForm ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-nyeni-blue-soft text-nyeni-blue flex items-center justify-center mb-2.5 shadow-2xs">
                {remembered.role === 'admin' ? (
                  <Shield className="w-6 h-6 text-amber-600" />
                ) : (
                  <UserCheck className="w-6 h-6 text-nyeni-blue" />
                )}
              </div>

              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Pengingat Akun Tersimpan
              </span>
              <h2 className="text-base font-extrabold text-foreground mt-0.5">
                {remembered.fullName}
              </h2>
              <p className="text-xs font-mono text-nyeni-blue font-bold">@{remembered.username}</p>

              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] font-semibold text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Siap Masuk Cepat</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            {/* Quick Continue Button with Animation */}
            <button
              type="button"
              onClick={handleQuickContinue}
              disabled={isAutoLoggingIn}
              className="w-full py-3.5 px-4 rounded-xl bg-nyeni-navy hover:bg-nyeni-blue text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-75"
            >
              {isAutoLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-nyeni-mango" />
                  <span>Menyiapkan Sesi Kasir...</span>
                </>
              ) : (
                <>
                  <span>Lanjutkan Sebagai {remembered.fullName.split(' ')[0]}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Switch Account Buttons */}
            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => setShowSwitchForm(true)}
                className="text-nyeni-blue font-bold hover:underline"
              >
                Gunakan Akun Lain
              </button>
              <button
                type="button"
                onClick={handleForgetAccount}
                className="text-muted hover:text-rose-600 transition-colors"
              >
                Lupakan Akun
              </button>
            </div>
          </div>
        ) : (
          /* ----------------------------------------------------------- */
          /* VIEW B: FORM LOGIN STANDAR DENGAN 1-KLIK ISI CEPAT          */
          /* ----------------------------------------------------------- */
          <div>
            {/* 1-Click Quick Select Pills */}
            <div className="mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span>Pilihan Akun Cepat:</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  Aktif
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => fillQuickAccount('kasir_yossika', 'kasirsukses2026')}
                  className="p-2.5 rounded-xl border border-nyeni-blue/30 bg-nyeni-blue-soft text-left hover:border-nyeni-blue transition-colors flex flex-col justify-between"
                >
                  <div className="flex items-center gap-1.5 font-bold text-nyeni-navy">
                    <Store className="w-3.5 h-3.5 text-nyeni-blue" />
                    <span>Kasir (Yossika)</span>
                  </div>
                  <p className="text-[10px] text-nyeni-blue font-mono font-bold mt-1">@kasir_yossika</p>
                  <p className="text-[9px] text-muted">Pw: kasirsukses2026</p>
                </button>

                <button
                  type="button"
                  onClick={() => fillQuickAccount('admin', 'admin123')}
                  className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/80 text-left hover:border-amber-400 transition-colors flex flex-col justify-between"
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

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3.5">
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
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-nyeni-blue/30 focus:border-nyeni-blue transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-nyeni-navy mb-1.5">
                  Kata Sandi
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
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-nyeni-blue/30 focus:border-nyeni-blue transition-all"
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
                    <Loader2 className="w-4 h-4 animate-spin text-nyeni-mango" />
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

            {remembered && (
              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => setShowSwitchForm(false)}
                  className="text-xs font-semibold text-nyeni-blue hover:underline"
                >
                  Kembali ke pengingat akun ({remembered.fullName.split(' ')[0]})
                </button>
              </div>
            )}
          </div>
        )}

        <p className="mt-5 text-[11px] text-center text-slate-400 font-medium">
          NyeniPOS Standalone Engine &bull; Enkripsi Sesi Browser Lokal
        </p>
      </motion.div>
    </div>
  );
}
