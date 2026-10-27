'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store,
  QrCode,
  ShoppingBag,
  BarChart3,
  CheckCircle2,
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';

interface FeatureTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOUR_STEPS = [
  {
    step: 1,
    title: 'Kasir POS Cepat & Touchscreen Friendly',
    subtitle: 'Pilih Menu, Ukuran Cup & Add-on Pesanan',
    icon: Store,
    badge: 'Fitur Utama',
    badgeColor: 'bg-nyeni-blue-soft text-nyeni-blue',
    description:
      'Katalog lengkap 3 signature menu: Dragon Sago, Mango Sago, dan Strawberry Sago. Cukup klik menu untuk memilih ukuran cup (200 ml s/d 500 ml) dan tambahkan Mix Fruit tambahan. Struk tercetak rapi untuk printer thermal 58/80 mm.',
    tips: 'Setiap cup yang terjual akan memotong gramasi stok bahan (buah, sagu, susu, cup & sendok) secara otomatis.',
  },
  {
    step: 2,
    title: 'Pembayaran Lengkap & QRIS GoPay Merchant',
    subtitle: 'QRIS Resmi Toko, Transfer Blu BCA, & Tunai',
    icon: QrCode,
    badge: 'Metode Bayar',
    badgeColor: 'bg-emerald-50 text-emerald-700',
    description:
      'Tersedia 3 metode pembayaran kasir: Scan QRIS GoPay Merchant resmi toko (bisa diperbesar satu klik), Transfer ke Blu by BCA Digital (000596641881 a/n Yossika Putra Erlangga) dengan tombol 1-klik salin rekening, dan Tunai dengan hitung kembalian instan.',
    tips: 'Nomor referensi GoBiz kasir dapat dimasukkan untuk mempermudah pencocokan mutasi harian.',
  },
  {
    step: 3,
    title: 'Belanja Bahan & Restock Buah',
    subtitle: 'Tempat Memasukkan Belanja Buah & Bahan Stok',
    icon: ShoppingBag,
    badge: 'Pertanyaan Sering Ditanyakan',
    badgeColor: 'bg-amber-50 text-amber-800',
    description:
      'Habis belanja buah naga, mangga harum manis, stroberi segar, susu, atau cup di pasar/supplier? Masukkan notanya di menu "Belanja Bahan (Restock)". Masukkan harga beli dan kuantiti kg/pcs, stok akan bertambah dan HPP otomatis diperbarui.',
    tips: 'Akses menu ini langsung dari Sidebar samping: "Belanja Bahan (Restock)" atau dari halaman Stok Bahan Baku.',
  },
  {
    step: 4,
    title: 'Laporan Finansial, Excel & PDF Resmi',
    subtitle: 'Laba Bersih Nyata & Ekspor Dokumen',
    icon: BarChart3,
    badge: 'Laporan & Audit',
    badgeColor: 'bg-purple-50 text-purple-700',
    description:
      'Dapatkan rincian keuangan otomatis: Omzet penjualan, HPP bahan baku terpakai, beban pengeluaran toko, dan estimasi laba bersih. Seluruh data dapat diunduh ke Excel (.xlsx) multi-sheet atau dokumen cetak PDF formal satu klik.',
    tips: 'Sistem menggunakan penyimpanan mandiri di browser Anda tanpa server luar, aman dan 100% responsif di HP, tablet & laptop.',
  },
];

export function FeatureTourModal({ isOpen, onClose }: FeatureTourModalProps) {
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  const current = TOUR_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('nyeni_tour_viewed', 'true');
      }
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const StepIcon = current.icon;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: -10 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="w-full max-w-lg bg-white rounded-[28px] border border-slate-200/90 shadow-[0_25px_60px_rgba(20,42,114,0.22)] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-nyeni-blue-soft border border-nyeni-blue/20 text-nyeni-blue flex items-center justify-center shadow-2xs">
                <StepIcon className="w-6 h-6 text-nyeni-blue" />
              </div>
              <div>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${current.badgeColor} mb-0.5`}>
                  {current.badge}
                </span>
                <h3 className="text-base font-black text-nyeni-navy tracking-tight leading-tight">
                  {current.title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Tutup Panduan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <h4 className="text-xs font-bold text-nyeni-blue uppercase tracking-wider">
              {current.subtitle}
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              {current.description}
            </p>

            {/* Pro Tip Box */}
            <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-100 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-nyeni-blue shrink-0 mt-0.5" />
              <p className="text-[11px] sm:text-xs text-sky-950 font-semibold leading-relaxed">
                <strong className="font-extrabold text-nyeni-blue">Tips: </strong>
                {current.tips}
              </p>
            </div>
          </div>

          {/* Footer & Step Controls */}
          <div className="p-5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
            {/* Step Dots Indicator */}
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((s, idx) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2 rounded-full transition-all ${
                    currentStep === idx
                      ? 'w-6 bg-nyeni-blue'
                      : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                  title={`Langkah ${s.step}`}
                />
              ))}
              <span className="text-[11px] font-bold text-slate-500 ml-2">
                {currentStep + 1} / {TOUR_STEPS.length}
              </span>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-white transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 rounded-xl bg-nyeni-navy hover:bg-nyeni-blue text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
              >
                <span>{isLast ? 'Selesai & Mulai Pakai' : 'Lanjut'}</span>
                {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
