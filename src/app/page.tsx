'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Store,
  ShieldCheck,
  TrendingUp,
  Receipt,
  Boxes,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Clock,
  Layers,
  ChevronRight,
  Smartphone,
  Lock,
} from 'lucide-react';
import { ResponsiveProductImage } from '@/components/ui/ResponsiveProductImage';
import { formatRupiah } from '@/lib/format';

export default function LandingPage() {
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);

  const products = [
    {
      id: 'mango-sago',
      name: 'Mango Sago',
      badge: 'Best Seller Signature',
      category: 'Dessert Cup Dingin',
      tagline: 'Mangga Harum Manis Pilihan & Kuah Susu Gurih Manis',
      description:
        'Dessert cup ikonik dengan potongan buah mangga harum manis berlimpah, sagu mutiara kenyal, nata de coco, dan siraman kuah susu creamy spesial racikan rahasia Mango Nyeni.',
      image: '/assets/mango-sago-splash-stack.webp',
      variants: [
        { name: '200 ml', price: 13000 },
        { name: '300 ml', price: 17000 },
        { name: '400 ml', price: 22000 },
        { name: '500 ml', price: 27000 },
      ],
      highlights: ['100% Buah Mangga Asli', 'Tanpa Pemanis Buatan', 'Sagu Mutiara Kenyal'],
    },
    {
      id: 'dragon-sago',
      name: 'Dragon Sago',
      badge: 'Favorit Segar Kaya Vitamin',
      category: 'Dessert Cup Dingin',
      tagline: 'Buah Naga Merah Segar & Kuah Creamy Spesial',
      description:
        'Perpaduan istimewa buah naga merah segar kaya antioksidan dengan sagu mutiara lembut dan kuah kental gurih manis yang lumer di lidah, memberikan sensasi kesegaran tropis maksimal.',
      image: '/assets/dragon-sago-only.webp',
      variants: [
        { name: '200 ml', price: 13000 },
        { name: '300 ml', price: 17000 },
        { name: '400 ml', price: 22000 },
        { name: '500 ml', price: 27000 },
      ],
      highlights: ['Buah Naga Merah Grade A', 'Warna Alami Alami', 'Sensasi Creamy Gurih'],
    },
    {
      id: 'strawberry-sago',
      name: 'Strawberry Sago',
      badge: 'Summer Delight Refreshing',
      category: 'Dessert Cup Dingin',
      tagline: 'Stroberi Segar Asam Manis Berpadu Susu Mewah',
      description:
        'Kombinasi stroberi segar pilihan dengan rasa asam manis seimbang, sagu mutiara, dan kuah susu kental manis gurih yang menyatu sempurna. Sangat cocok dinikmati dingin saat cuaca terik.',
      image: '/assets/strawberry-sago-only.webp',
      variants: [
        { name: '200 ml', price: 13000 },
        { name: '300 ml', price: 17000 },
        { name: '400 ml', price: 22000 },
        { name: '500 ml', price: 27000 },
      ],
      highlights: ['Stroberi Segar Petik', 'Sensasi Asam Manis Pas', 'Tekstur Mewah Lembut'],
    },
  ];

  const currentProd = products[selectedProductIndex];

  return (
    <div className="min-h-screen relative flex flex-col font-sans selection:bg-nyeni-blue selection:text-white">
      {/* ------------------------------------------------------------- */}
      {/* BACKGROUND: REAL BLUE SKY WITH WHITE CLOUDS PHOTOGRAPHY       */}
      {/* ------------------------------------------------------------- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <Image
          src="/assets/real-clouds-bg-fast.webp"
          alt="Real Blue Sky with White Clouds"
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
        {/* Soft, clean atmospheric glassmorphic overlay without expensive blur filter */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-sky-50/60 to-white/90" />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* STICKY GLASSMORPHIC NAVBAR (iOS Style)                        */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto backdrop-blur-md bg-white/85 border border-white/80 rounded-full px-4 sm:px-6 py-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-white shadow-xs p-1 border border-nyeni-blue/20 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
              <Image
                src="/assets/logo-mango-nyeni-sm.webp"
                alt="Logo Mango Nyeni"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black text-nyeni-navy tracking-tight">NyeniPOS</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[10px] font-bold text-nyeni-blue tracking-wider uppercase">
                Mango Nyeni Official
              </p>
            </div>
          </Link>

          {/* Nav Links Desktop */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-700">
            <a href="#menu" className="hover:text-nyeni-blue transition-colors">
              Menu Signature
            </a>
            <a href="#operasional" className="hover:text-nyeni-blue transition-colors">
              Fitur Kasir & Resep
            </a>
            <a href="#laporan" className="hover:text-nyeni-blue transition-colors">
              Laporan & Excel/PDF
            </a>
            <a href="#keamanan" className="hover:text-nyeni-blue transition-colors">
              Keamanan Industri
            </a>
          </nav>

          {/* Action Login Buttons */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 hover:text-nyeni-navy hover:bg-white/60 transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/pos"
              className="px-4 py-2 rounded-full text-xs font-extrabold bg-nyeni-navy hover:bg-nyeni-blue text-white shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Buka POS</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT                                                  */}
      {/* ------------------------------------------------------------- */}
      <main className="relative z-10 flex-1 flex flex-col">
        {/* HERO SECTION */}
        <section className="px-4 sm:px-6 pt-10 pb-16 sm:pt-16 sm:pb-24 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white/60 text-nyeni-blue text-xs font-bold shadow-xs mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-nyeni-blue" />
            <span>Sistem Kasir & Operasional Resmi Mango Nyeni</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-black text-nyeni-navy tracking-tight leading-[1.12]"
          >
            Kasir Cepat, Stok Akurat, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-nyeni-blue to-nyeni-navy bg-clip-text text-transparent">
              Laba Bersih Terhitung Nyata.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-5 text-sm sm:text-base text-slate-700 max-w-2xl mx-auto font-medium leading-relaxed"
          >
            Sistem operasional terpadu yang memadukan kecepatan kasir touchscreen, formula resep
            gramasi otomatis, pemotongan stok bahan real-time, dan pemisahan arus kas vs laba rugi.
            Tanpa ketergantungan server luar, 100% responsif dan siap pakai.
          </motion.p>

          {/* Hero CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/pos"
              className="px-6 py-3.5 rounded-full bg-nyeni-navy hover:bg-nyeni-blue text-white font-extrabold text-sm shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 group"
            >
              <Store className="w-4 h-4 text-white" />
              <span>Mulai Transaksi Kasir (POS)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/dashboard"
              className="px-6 py-3.5 rounded-full bg-white/85 hover:bg-white text-nyeni-navy border border-white/80 font-bold text-sm shadow-md hover:shadow-lg backdrop-blur-md transition-all flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4 text-nyeni-blue" />
              <span>Portal Dashboard Admin</span>
            </Link>
          </motion.div>

          {/* Quick Demo Credentials Pill */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 inline-flex flex-wrap items-center justify-center gap-2 sm:gap-4 p-2 px-4 rounded-2xl bg-white/70 backdrop-blur-md border border-white/60 shadow-xs text-xs text-slate-700"
          >
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-nyeni-navy">Kasir:</span>
              <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px]">
                kasir_yossika
              </code>
              <span className="text-muted">/</span>
              <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px]">
                kasirsukses2026
              </code>
            </div>
            <div className="hidden sm:inline text-slate-300">|</div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-nyeni-navy">Admin:</span>
              <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px]">admin</code>
              <span className="text-muted">/</span>
              <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px]">
                admin123
              </code>
            </div>
          </motion.div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* INTERACTIVE MENU SPOTLIGHT (Dragon, Mango, Strawberry Sago)   */}
        {/* ------------------------------------------------------------- */}
        <section id="menu" className="px-4 sm:px-6 py-12 max-w-6xl mx-auto w-full">
          <div className="text-center mb-8">
            <span className="text-xs font-extrabold text-nyeni-blue tracking-widest uppercase">
              Katalog Resmi
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-nyeni-navy tracking-tight mt-1">
              3 Signature Menu Mango Nyeni
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto mt-1.5">
              Format kompresi WebP 3x responsif (thumbnail, klik, dan zoom resolusi tinggi) untuk
              tampilan super smooth dan tajam di segala resolusi.
            </p>

            {/* Product Switcher Tabs */}
            <div className="mt-6 inline-flex p-1 rounded-full bg-white/70 backdrop-blur-md border border-white/60 shadow-xs">
              {products.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProductIndex(idx)}
                  className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                    selectedProductIndex === idx
                      ? 'bg-nyeni-navy text-white shadow-md'
                      : 'text-slate-700 hover:text-nyeni-navy'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Active Product Showcase Card */}
          <div className="backdrop-blur-md bg-white/90 border border-white/80 rounded-[28px] p-6 sm:p-10 shadow-[0_20px_50px_rgba(20,42,114,0.06)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Product Image with Zoom Feature */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-[340px] aspect-square rounded-[24px] bg-gradient-to-b from-sky-50 to-white border border-slate-100 p-4 shadow-sm relative overflow-hidden flex items-center justify-center">
                <ResponsiveProductImage
                  src={currentProd.image}
                  alt={currentProd.name}
                  size="md"
                  allowZoom={true}
                  className="w-full h-full"
                />
              </div>
              <p className="text-[11px] text-slate-500 font-semibold mt-2.5 text-center">
                Klik ikon zoom di kanan bawah foto untuk resolusi detail
              </p>
            </div>

            {/* Right: Product Info & Pricing */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-nyeni-blue-soft text-nyeni-blue text-xs font-bold mb-3">
                  <span>{currentProd.badge}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-nyeni-navy tracking-tight">
                  {currentProd.name}
                </h3>
                <p className="text-sm font-semibold text-nyeni-blue mt-0.5">
                  {currentProd.tagline}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
                  {currentProd.description}
                </p>

                {/* Highlights */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {currentProd.highlights.map((h) => (
                    <span
                      key={h}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-full"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>{h}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Price List Table Grid */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-xs font-bold text-nyeni-navy uppercase tracking-wider mb-2.5">
                  Daftar Pilihan Ukuran Cup & Harga:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {currentProd.variants.map((v) => (
                    <div
                      key={v.name}
                      className="p-3 rounded-2xl bg-white border border-slate-200/80 text-center shadow-2xs hover:border-nyeni-blue transition-colors"
                    >
                      <span className="text-xs font-extrabold text-slate-700 block">{v.name}</span>
                      <span className="text-sm font-black text-nyeni-blue mt-0.5 block">
                        {formatRupiah(v.price)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs font-semibold text-amber-900 flex items-center justify-between">
                  <span>Add-on Tambahan: <strong>Mix Fruit (Mangga, Naga & Stroberi)</strong></span>
                  <span className="font-bold text-amber-800">+Rp 2.000</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* FITUR OPERASIONAL UNGGULAN                                    */}
        {/* ------------------------------------------------------------- */}
        <section id="operasional" className="px-4 sm:px-6 py-12 max-w-6xl mx-auto w-full">
          <div className="text-center mb-10">
            <span className="text-xs font-extrabold text-nyeni-blue tracking-widest uppercase">
              Standar Operasional
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-nyeni-navy tracking-tight mt-1">
              Dirancang untuk Kelancaran Nyata di Outlet
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="backdrop-blur-sm bg-white/90 border border-white/80 rounded-[24px] p-6 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-nyeni-blue-soft text-nyeni-blue flex items-center justify-center mb-4">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-nyeni-navy">Kasir POS Cepat & Tanggap</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Pencarian instan, varian cup satu klik, tombol uang pas, kalkulator kembalian cepat,
                dan dukungan pembayaran QRIS GoPay Merchant maupun Transfer Bank.
              </p>
            </div>

            {/* Card 2 */}
            <div className="backdrop-blur-sm bg-white/90 border border-white/80 rounded-[24px] p-6 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Boxes className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-nyeni-navy">Resep & Stok Otomatis</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Takaran gramasi nyata per porsi (buah, sagu, susu, cup, sendok). Begitu struk
                tercetak, stok bahan langsung terpotong secara atomik tanpa risiko salah hitung.
              </p>
            </div>

            {/* Card 3 */}
            <div className="backdrop-blur-sm bg-white/90 border border-white/80 rounded-[24px] p-6 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-nyeni-navy">Struk Thermal 58/80 mm</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Format cetak struk profesional langsung ke printer thermal kasir USB/Bluetooth via
                browser print. Dilengkapi rincian add-on dan footer pesan terima kasih.
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* LAPORAN & EKSPOR EXCEL / PDF                                  */}
        {/* ------------------------------------------------------------- */}
        <section id="laporan" className="px-4 sm:px-6 py-12 max-w-6xl mx-auto w-full">
          <div className="bg-gradient-to-r from-nyeni-navy to-[#18348a] rounded-[28px] p-8 sm:p-12 text-white shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold mb-3 border border-white/10">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Pusat Laporan Lengkap</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                Ekspor Data ke Excel (.xlsx) & Dokumen PDF Resmi
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 mt-3 leading-relaxed">
                Dapatkan laporan keuangan terperinci meliputi estimasi Laba Rugi, HPP bahan baku,
                beban operasional toko, dan pemisahan arus kas riil. Unduh dalam satu klik ke format
                Excel multi-sheet, PDF statement formal, atau CSV.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/reports"
                  className="px-5 py-2.5 rounded-full bg-white text-nyeni-navy font-bold text-xs shadow-md hover:bg-slate-100 transition-colors flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4 text-nyeni-blue" />
                  <span>Buka Menu Laporan</span>
                </Link>
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 transition-colors flex items-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Login Sebagai Admin</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-3 text-slate-800">
              <div className="bg-white/95 p-4 rounded-2xl shadow-md border border-white">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600 mb-2" />
                <h4 className="text-xs font-extrabold text-nyeni-navy">Buku Kerja Excel</h4>
                <p className="text-[11px] text-slate-600 mt-1">Multi-sheet: Laba Rugi, Penjualan, Pengeluaran, Restock & Konsumsi Bahan.</p>
              </div>

              <div className="bg-white/95 p-4 rounded-2xl shadow-md border border-white">
                <FileText className="w-6 h-6 text-rose-600 mb-2" />
                <h4 className="text-xs font-extrabold text-nyeni-navy">Dokumen PDF</h4>
                <p className="text-[11px] text-slate-600 mt-1">Format A4 resmi dengan kop bisnis, KPI cards, dan kolom pengesahan owner.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* KEAMANAN & STANDAR INDUSTRI                                   */}
        {/* ------------------------------------------------------------- */}
        <section id="keamanan" className="px-4 sm:px-6 py-12 max-w-6xl mx-auto w-full text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Keamanan & Ketahanan Sistem Berstandar Industri</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-nyeni-navy tracking-tight">
            Perlindungan Data & Kontrol Hak Akses Total
          </h2>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            <div className="p-4 rounded-2xl bg-white/80 border border-white/80 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-nyeni-blue mb-2" />
              <h4 className="text-xs font-bold text-nyeni-navy">Pemisahan Hak Kasir & Admin</h4>
              <p className="text-[11px] text-slate-600 mt-1">Kasir hanya memproses penjualan tanpa akses ke rahasia HPP, biaya, atau resep.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 border border-white/80 shadow-xs">
              <Clock className="w-5 h-5 text-amber-500 mb-2" />
              <h4 className="text-xs font-bold text-nyeni-navy">Transaksi Idempotent</h4>
              <p className="text-[11px] text-slate-600 mt-1">Mencegah pesanan ganda atau pemotongan stok berulang jika kasir menekan tombol checkout dua kali.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 border border-white/80 shadow-xs">
              <Boxes className="w-5 h-5 text-emerald-500 mb-2" />
              <h4 className="text-xs font-bold text-nyeni-navy">Mutasi Stok Append-Only</h4>
              <p className="text-[11px] text-slate-600 mt-1">Semua riwayat mutasi bahan, opname, dan pembatalan transaksi terekam permanen.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 border border-white/80 shadow-xs">
              <Smartphone className="w-5 h-5 text-nyeni-navy mb-2" />
              <h4 className="text-xs font-bold text-nyeni-navy">Penyimpanan Mandiri & Cadangan</h4>
              <p className="text-[11px] text-slate-600 mt-1">Tersedia fitur ekspor backup database JSON untuk dicadangkan sewaktu-waktu.</p>
            </div>
          </div>
        </section>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* FOOTER                                                        */}
      {/* ------------------------------------------------------------- */}
      <footer className="relative z-10 px-4 sm:px-6 py-8 border-t border-white/50 backdrop-blur-md bg-white/60 text-slate-600 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image
              src="/assets/logo-mango-nyeni-sm.webp"
              alt="Logo Mango Nyeni"
              width={24}
              height={24}
              className="object-contain"
            />
            <span className="font-bold text-nyeni-navy">NyeniPOS &bull; Mango Nyeni</span>
            <span className="text-slate-400">|</span>
            <span>Sistem Operasional Dessert Cup Mandiri</span>
          </div>
          <div className="text-slate-500 text-center sm:text-right">
            &copy; 2026 <strong>Mango Nyeni</strong>. Seluruh hak cipta dilindungi.
          </div>
        </div>
      </footer>
    </div>
  );
}
