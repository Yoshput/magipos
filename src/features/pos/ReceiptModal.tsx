'use client';

import React from 'react';
import { Sale, BusinessSettings } from '@/types';
import { formatRupiah, formatDateTime } from '@/lib/format';
import { Printer, X, CheckCircle, ArrowRight } from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale | null;
  settings?: BusinessSettings | null;
  onClose: () => void;
}

export function ReceiptModal({ sale, settings, onClose }: ReceiptModalProps) {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const businessName = settings?.business_name || 'Mango Nyeni';
  const storeAddress = settings?.store_address || 'Jl. Raya Mangga No. 88, Jakarta';
  const receiptHeader = settings?.receipt_header || 'Sensasi Dessert Sago Asli & Creamy!';
  const receiptFooter = settings?.receipt_footer || 'Terima kasih atas kunjungan Anda!';
  const instagram = settings?.instagram_url ? `@${settings.instagram_url.replace(/.*instagram\.com\//, '').replace(/\/$/, '')}` : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 print:p-0 print:bg-white print:static">
      <div className="w-full max-w-sm bg-white rounded-ios-card shadow-ios-modal border border-border overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Top Success Banner (Hidden during print) */}
        <div className="bg-emerald-600 text-white p-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-200" />
            <span className="text-sm font-bold">Transaksi Berhasil!</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-emerald-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Thermal Receipt Container (58mm/80mm compatible) */}
        <div className="flex-1 overflow-y-auto p-5 text-slate-900 font-mono text-xs leading-relaxed print:p-0 print:overflow-visible">
          {/* Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h2 className="text-base font-black tracking-wider uppercase font-sans text-nyeni-navy">
              {businessName}
            </h2>
            <p className="text-[11px] text-slate-600 mt-0.5">{storeAddress}</p>
            {receiptHeader && (
              <p className="text-[10px] text-slate-500 italic mt-1">{receiptHeader}</p>
            )}
          </div>

          {/* Transaction Metadata */}
          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>No. Transaksi:</span>
              <span className="font-bold">{sale.receipt_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Waktu:</span>
              <span>{formatDateTime(sale.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir:</span>
              <span>{sale.cashier?.full_name || 'Petugas'}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-bold uppercase text-emerald-700">LUNAS</span>
            </div>
          </div>

          {/* Items List */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
            {(sale.items || []).map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span className="truncate pr-2">
                    {item.quantity}x {item.product_name_snapshot} ({item.variant_name_snapshot})
                  </span>
                  <span className="tabular-nums shrink-0">
                    {formatRupiah(item.line_total_idr)}
                  </span>
                </div>

                {/* Addons */}
                {item.addons &&
                  item.addons.map((addon, aIdx) => (
                    <div
                      key={aIdx}
                      className="flex justify-between text-[10px] text-slate-600 pl-3"
                    >
                      <span>+ {addon.addon_name_snapshot}</span>
                      <span className="tabular-nums">{formatRupiah(addon.line_total_idr)}</span>
                    </div>
                  ))}
              </div>
            ))}
          </div>

          {/* Totals & Payment */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="tabular-nums">{formatRupiah(sale.subtotal_idr)}</span>
            </div>
            {sale.discount_idr > 0 && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>Diskon:</span>
                <span className="tabular-nums">-{formatRupiah(sale.discount_idr)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-200">
              <span>TOTAL:</span>
              <span className="tabular-nums">{formatRupiah(sale.total_idr)}</span>
            </div>

            <div className="flex justify-between text-[11px] pt-1 text-slate-700">
              <span>Metode Bayar:</span>
              <span className="font-bold uppercase">{sale.payment_method}</span>
            </div>

            {sale.payment_method === 'cash' && (
              <>
                <div className="flex justify-between text-[11px] text-slate-700">
                  <span>Tunai Diterima:</span>
                  <span className="tabular-nums">{formatRupiah(sale.cash_received_idr)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-slate-900">
                  <span>Kembalian:</span>
                  <span className="tabular-nums">{formatRupiah(sale.change_due_idr)}</span>
                </div>
              </>
            )}
          </div>

          {/* Footer Note */}
          <div className="text-center pt-3 text-[11px] text-slate-600 space-y-1">
            <p>{receiptFooter}</p>
            {instagram && <p className="font-semibold text-slate-800">Follow us on IG: {instagram}</p>}
          </div>
        </div>

        {/* Action Buttons (Hidden during print) */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2.5 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-3 rounded-ios border border-border bg-white text-foreground hover:bg-slate-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-nyeni-blue" />
            <span>Cetak Struk (58/80mm)</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-ios bg-nyeni-navy text-white hover:bg-nyeni-navy-hover font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <span>Transaksi Baru</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
