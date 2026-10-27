'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Sale, BusinessSettings } from '@/types';
import { formatRupiah, formatDateTime } from '@/lib/format';
import {
  Printer,
  X,
  CheckCircle2,
  ArrowRight,
  Copy,
  Check,
  Share2,
  MessageCircle,
  Receipt,
  Download,
} from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale | null;
  settings?: BusinessSettings | null;
  onClose: () => void;
}

export function ReceiptModal({ sale, settings, onClose }: ReceiptModalProps) {
  const [copied, setCopied] = useState(false);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const businessName = settings?.business_name || 'MAGI NYENI STORE';
  const brandName = 'Mango Nyeni — Dessert Sago Signature';
  const storeAddress = settings?.store_address || 'Jl. Raya Mangga No. 88, Outlet Resmi';
  const receiptHeader = settings?.receipt_header || 'Sensasi Dessert Sago Asli, Manis & Creamy';
  const receiptFooter = settings?.receipt_footer || 'Terima kasih atas kunjungan Anda!';
  const instagram = settings?.instagram_url
    ? `@${settings.instagram_url.replace(/.*instagram\.com\//, '').replace(/\/$/, '')}`
    : '@mangonyeni';

  // Build clean Plain-Text Receipt for WhatsApp / Clipboard
  const generateReceiptText = () => {
    const lines = [
      `*================================*`,
      `*${businessName}*`,
      `_${brandName}_`,
      storeAddress,
      `*================================*`,
      `No. Invoice : *${sale.receipt_number}*`,
      `Waktu       : ${formatDateTime(sale.created_at)}`,
      `Kasir Bertugas: ${sale.cashier?.full_name || 'Petugas'}`,
      `Status      : *LUNAS (PAID)*`,
      `*--------------------------------*`,
      `*RINCIAN PESANAN DESSERT:*`,
    ];

    (sale.items || []).forEach((item) => {
      lines.push(
        `${item.quantity}x ${item.product_name_snapshot} (${item.variant_name_snapshot}) - ${formatRupiah(item.line_total_idr)}`
      );
      if (item.addons && item.addons.length > 0) {
        item.addons.forEach((ad) => {
          lines.push(`   + ${ad.addon_name_snapshot} (${formatRupiah(ad.line_total_idr)})`);
        });
      }
    });

    lines.push(`*--------------------------------*`);
    lines.push(`Subtotal     : ${formatRupiah(sale.subtotal_idr)}`);
    if (sale.discount_idr > 0) {
      lines.push(`Diskon       : -${formatRupiah(sale.discount_idr)}`);
    }
    lines.push(`*TOTAL BAYAR  : ${formatRupiah(sale.total_idr)}*`);
    lines.push(`Metode Bayar : *${sale.payment_method.toUpperCase()}*`);

    if (sale.payment_method === 'qris') {
      lines.push(`QRIS Merchant: MAGI NYENI STORE (GoPay/GPN)`);
      if (sale.qris_reference) {
        lines.push(`Ref Transaksi: ${sale.qris_reference}`);
      }
    } else if (sale.payment_method === 'transfer') {
      lines.push(`Rekening     : Blu by BCA (000596641881)`);
      lines.push(`Atas Nama    : Yossika Putra Erlangga`);
    } else if (sale.payment_method === 'cash') {
      lines.push(`Uang Diterima: ${formatRupiah(sale.cash_received_idr)}`);
      lines.push(`Kembalian    : ${formatRupiah(sale.change_due_idr)}`);
    }

    lines.push(`*--------------------------------*`);
    lines.push(`${receiptFooter}`);
    lines.push(`Follow Instagram kami: ${instagram}`);
    lines.push(`*================================*`);

    return lines.join('\n');
  };

  const handleCopyReceipt = () => {
    const text = generateReceiptText();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendWhatsapp = () => {
    const text = generateReceiptText();
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleDownloadReceipt = () => {
    const text = generateReceiptText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Struk-${sale.receipt_number}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150 print:p-0 print:bg-white print:static">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-[26px] shadow-[0_25px_60px_rgba(20,42,114,0.22)] border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Top Header Banner (Hidden during print) */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-4 flex items-center justify-between print:hidden shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider block">
                Pembayaran Sukses
              </span>
              <span className="text-[11px] text-emerald-100 font-medium">
                Struk Digital #{sale.receipt_number}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-emerald-800/60 transition-colors"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Digital E-Receipt Content (F&B Standard) */}
        <div className="flex-1 overflow-y-auto p-5 text-slate-800 font-sans text-xs leading-relaxed print:p-0 print:overflow-visible space-y-4">
          {/* Logo & Brand Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-50 border border-slate-200 p-1 mb-2 flex items-center justify-center overflow-hidden">
              <Image
                src="/assets/logo-mango-nyeni-sm.webp"
                alt="Logo Mango Nyeni"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <h2 className="text-sm sm:text-base font-black tracking-wider uppercase text-nyeni-navy">
              {businessName}
            </h2>
            <p className="text-[11px] font-bold text-nyeni-blue">{brandName}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{storeAddress}</p>
            {receiptHeader && (
              <p className="text-[10px] text-slate-500 italic mt-1 font-medium">{receiptHeader}</p>
            )}
          </div>

          {/* Invoice & Order Metadata Box */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">No. Invoice:</span>
              <span className="font-mono font-black text-slate-900">{sale.receipt_number}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Waktu Transaksi:</span>
              <span className="font-semibold text-slate-800">{formatDateTime(sale.created_at)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Kasir Bertugas:</span>
              <span className="font-bold text-slate-800">{sale.cashier?.full_name || 'Petugas'}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200">
              <span className="text-slate-500 font-medium">Status Bayar:</span>
              <span className="inline-flex items-center gap-1 font-black text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>LUNAS (PAID)</span>
              </span>
            </div>
          </div>

          {/* Purchased Items List (Beli Apa) */}
          <div className="space-y-2.5">
            <div className="flex justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-200">
              <span>Item Menu</span>
              <span>Total</span>
            </div>

            <div className="space-y-2">
              {(sale.items || []).map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-baseline font-bold text-slate-900">
                    <span className="truncate pr-2 text-xs">
                      {item.quantity}x {item.product_name_snapshot} ({item.variant_name_snapshot})
                    </span>
                    <span className="tabular-nums font-mono text-xs shrink-0">
                      {formatRupiah(item.line_total_idr)}
                    </span>
                  </div>

                  {/* Addon details if any */}
                  {item.addons &&
                    item.addons.map((addon, aIdx) => (
                      <div
                        key={aIdx}
                        className="flex justify-between text-[10px] text-slate-500 pl-3 font-medium"
                      >
                        <span>+ {addon.addon_name_snapshot}</span>
                        <span className="font-mono tabular-nums">
                          {formatRupiah(addon.line_total_idr)}
                        </span>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>

          {/* Invoice Summary & Payment Details */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600 text-[11px]">
              <span>Subtotal Pesanan:</span>
              <span className="font-mono tabular-nums">{formatRupiah(sale.subtotal_idr)}</span>
            </div>

            {sale.discount_idr > 0 && (
              <div className="flex justify-between text-rose-600 font-medium text-[11px]">
                <span>Diskon Promosi:</span>
                <span className="font-mono tabular-nums">-{formatRupiah(sale.discount_idr)}</span>
              </div>
            )}

            <div className="flex justify-between font-black text-sm pt-2 border-t border-slate-200 text-nyeni-navy">
              <span>TOTAL DIBAYAR:</span>
              <span className="font-mono text-base tabular-nums">{formatRupiah(sale.total_idr)}</span>
            </div>

            {/* Payment Method Details */}
            <div className="pt-2 border-t border-slate-200 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-700">
                <span className="font-medium">Metode Pembayaran:</span>
                <span className="font-black text-nyeni-blue uppercase">
                  {sale.payment_method === 'qris'
                    ? 'QRIS GoPay Merchant'
                    : sale.payment_method === 'transfer'
                    ? 'Transfer Blu by BCA'
                    : 'Uang Tunai (Cash)'}
                </span>
              </div>

              {sale.payment_method === 'qris' && (
                <>
                  <div className="flex justify-between text-slate-600 text-[10px]">
                    <span>Merchant:</span>
                    <span className="font-semibold">MAGI NYENI STORE</span>
                  </div>
                  {sale.qris_reference && (
                    <div className="flex justify-between text-slate-600 text-[10px]">
                      <span>Ref No GoBiz:</span>
                      <span className="font-mono font-bold text-slate-800">{sale.qris_reference}</span>
                    </div>
                  )}
                </>
              )}

              {sale.payment_method === 'transfer' && (
                <div className="flex justify-between text-slate-600 text-[10px]">
                  <span>Rekening Tujuan:</span>
                  <span className="font-semibold">Blu BCA - 000596641881</span>
                </div>
              )}

              {sale.payment_method === 'cash' && (
                <>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Tunai Diterima:</span>
                    <span className="font-mono tabular-nums">{formatRupiah(sale.cash_received_idr)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-800 text-[11px]">
                    <span>Kembalian Kasir:</span>
                    <span className="font-mono tabular-nums">{formatRupiah(sale.change_due_idr)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-2 text-[10px] text-slate-500 space-y-0.5">
            <p className="font-medium">{receiptFooter}</p>
            {instagram && <p className="font-bold text-nyeni-blue">Follow IG: {instagram}</p>}
            <p className="text-[9px] text-slate-400">Dicetak melalui NyeniPOS Digital Standalone</p>
          </div>
        </div>

        {/* Digital Action Buttons (WhatsApp, Salin, Transaksi Baru) */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50/80 space-y-2 print:hidden">
          {/* Quick Sharing Toolbar */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleCopyReceipt}
              className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs ${
                copied
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              title="Salin rincian struk"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSendWhatsapp}
              className="py-2 px-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              title="Kirim struk ke WhatsApp pelanggan"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="py-2 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              title="Cetak struk atau simpan ke PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Cetak / PDF</span>
            </button>
          </div>

          {/* Primary Dismiss Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-nyeni-navy hover:bg-nyeni-blue text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
          >
            <span>Mulai Transaksi Baru</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
