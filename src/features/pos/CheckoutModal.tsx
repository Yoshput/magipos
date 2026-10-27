'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import { useNotification } from '@/context/notification-context';
import { PaymentMethod, Sale } from '@/types';
import { formatRupiah, generateReceiptNumber } from '@/lib/format';
import { calculateChangeDue } from '@/lib/calculations';
import { localDb } from '@/lib/storage/local-db';
import {
  X,
  Banknote,
  QrCode,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Smartphone,
  ShieldCheck,
  Copy,
  Check,
  Maximize2,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (completedSale: Sale) => void;
}

export function CheckoutModal({ isOpen, onClose, onSuccess }: CheckoutModalProps) {
  const { items, subtotal, discountIdr, total, clearCart } = useCart();
  const { profile } = useAuth();
  const { notify } = useNotification();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<number>(total);
  const [qrisReference, setQrisReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedBank, setCopiedBank] = useState(false);
  const [isQrisZoomed, setIsQrisZoomed] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState('');

  // Generate unique idempotency key when opening modal
  useEffect(() => {
    if (isOpen) {
      setIdempotencyKey(`sale_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
      setCashReceived(total);
      setQrisReference('');
      setErrorMessage('');
    }
  }, [isOpen, total]);

  if (!isOpen) return null;

  const changeDue = paymentMethod === 'cash' ? calculateChangeDue(total, cashReceived) : 0;
  const isCashValid = paymentMethod !== 'cash' || (cashReceived >= total && changeDue >= 0);

  // Quick cash buttons
  const quickCashOptions = [
    { label: 'Uang Pas', amount: total },
    { label: 'Rp 20.000', amount: 20000 },
    { label: 'Rp 50.000', amount: 50000 },
    { label: 'Rp 100.000', amount: 100000 },
  ].filter((opt) => opt.amount >= total || opt.label === 'Uang Pas');

  const handleSubmit = async () => {
    if (!profile) {
      setErrorMessage('Sesi kasir tidak valid. Silakan login kembali.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Keranjang belanja kosong.');
      return;
    }

    if (paymentMethod === 'cash' && cashReceived < total) {
      setErrorMessage('Nominal uang tunai kurang dari total belanja.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const receiptNumber = generateReceiptNumber();

    // Prepare payload
    const itemsPayload = items.map((it) => {
      const addonsSum = it.addons.reduce((a, b) => a + b.unit_price_idr * b.quantity, 0);
      return {
        variant_id: it.variant_id,
        product_name: it.product_name,
        variant_name: it.variant_name,
        unit_price_idr: it.unit_price_idr,
        quantity: it.quantity,
        line_total_idr: (it.unit_price_idr + addonsSum) * it.quantity,
        addons: it.addons.map((a) => ({
          addon_id: a.addon_id,
          addon_name: a.addon_name,
          unit_price_idr: a.unit_price_idr,
          quantity: a.quantity,
        })),
      };
    });

    try {
      // Process sale through local storage database engine
      const completedSale = localDb.createSale(
        receiptNumber,
        profile.id,
        paymentMethod,
        subtotal,
        discountIdr,
        total,
        paymentMethod === 'cash' ? cashReceived : null,
        paymentMethod === 'cash' ? changeDue : 0,
        idempotencyKey,
        itemsPayload,
        {
          qris_reference: paymentMethod === 'qris' ? qrisReference.trim() || null : null,
        }
      );

      notify({
        type: 'success',
        title: `Transaksi #${receiptNumber} Selesai!`,
        message: `Total ${formatRupiah(total)} via ${paymentMethod.toUpperCase()} berhasil dicatat.`,
      });

      clearCart();
      onSuccess(completedSale);
      onClose();
    } catch (err: unknown) {
      console.error('Checkout error:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memproses transaksi kasir.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-ios-card shadow-ios-modal border border-border overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-nyeni-navy">Pembayaran POS</h3>
            <p className="text-xs text-muted">Pilih metode bayar & selesaikan pesanan</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-full text-muted hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Total Display */}
          <div className="bg-nyeni-blue-soft/50 rounded-ios p-4 text-center border border-nyeni-blue/20">
            <span className="text-xs font-bold text-nyeni-blue uppercase tracking-wider block">
              Total Tagihan
            </span>
            <span className="text-2xl sm:text-3xl font-black text-nyeni-navy tabular-nums mt-0.5 block">
              {formatRupiah(total)}
            </span>
            {discountIdr > 0 && (
              <span className="text-xs text-rose-600 font-semibold mt-1 block">
                (Hemat {formatRupiah(discountIdr)})
              </span>
            )}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
              Metode Pembayaran <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-ios border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-nyeni-blue bg-nyeni-blue-soft text-nyeni-blue shadow-xs'
                    : 'border-border bg-white text-muted hover:border-slate-300'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span>Tunai</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                className={`p-3 rounded-ios border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                  paymentMethod === 'qris'
                    ? 'border-nyeni-blue bg-nyeni-blue-soft text-nyeni-blue shadow-xs'
                    : 'border-border bg-white text-muted hover:border-slate-300'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span>QRIS</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`p-3 rounded-ios border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                  paymentMethod === 'transfer'
                    ? 'border-nyeni-blue bg-nyeni-blue-soft text-nyeni-blue shadow-xs'
                    : 'border-border bg-white text-muted hover:border-slate-300'
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span>Transfer</span>
              </button>
            </div>
          </div>

          {/* Method Specific Inputs */}
          {paymentMethod === 'cash' && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Uang Tunai Diterima (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={total}
                  step="1000"
                  value={cashReceived || ''}
                  onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 text-lg font-bold rounded-ios border border-border focus:outline-none focus:ring-2 focus:ring-nyeni-blue/30 focus:border-nyeni-blue tabular-nums text-foreground"
                />
              </div>

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1.5">
                {quickCashOptions.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCashReceived(opt.amount)}
                    className="px-2.5 py-1.5 rounded-lg border border-border bg-slate-50 text-xs font-semibold text-foreground hover:bg-slate-100 transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Change Due Box */}
              <div
                className={`p-3 rounded-ios border flex items-center justify-between transition-colors ${
                  changeDue >= 0
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                <span className="text-xs font-bold">Kembalian:</span>
                <span className="text-base font-black tabular-nums">
                  {changeDue >= 0 ? formatRupiah(changeDue) : 'Uang Kurang!'}
                </span>
              </div>
            </div>
          )}

          {paymentMethod === 'qris' && (
            <div className="p-4 bg-slate-50/90 rounded-ios-card border border-slate-200 text-center space-y-3">
              {/* GoPay & QRIS Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                <span className="font-extrabold text-nyeni-navy flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>GoPay Merchant / QRIS Standar</span>
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Siap Scan
                </span>
              </div>

              {/* Official Gopay Merchant QRIS Poster Image */}
              <div className="relative group mx-auto w-48 aspect-[3/4] bg-white rounded-2xl border-2 border-sky-400/40 p-2 shadow-sm overflow-hidden flex flex-col items-center justify-center">
                <Image
                  src="/assets/qris-gopay-merchant.webp"
                  alt="QRIS GoPay Merchant Magi Nyeni Store"
                  fill
                  sizes="192px"
                  className="object-contain p-1"
                  priority
                />
                <button
                  type="button"
                  onClick={() => setIsQrisZoomed(true)}
                  className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1 rounded-2xl"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>Perbesar QR</span>
                </button>
              </div>

              <div className="space-y-0.5">
                <p className="text-xs font-black text-nyeni-navy uppercase tracking-wide">
                  MAGI NYENI STORE, MAKANAN
                </p>
                <p className="text-[11px] font-mono text-slate-500">
                  NMID: ID1026485705432 &bull; Terminal A01
                </p>
                <p className="text-[11px] text-slate-600 pt-1 font-medium">
                  Scan dengan GoPay, BCA, Mandiri, BRI, BNI, ShopeePay & aplikasi QRIS lainnya.
                </p>
              </div>

              <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-muted font-medium">Total Nominal Tagihan:</span>
                <span className="font-extrabold text-nyeni-navy text-sm">{formatRupiah(total)}</span>
              </div>

              {/* GoBiz / GoPay Reference Input */}
              <div className="text-left pt-2 border-t border-slate-200/80">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nomor Referensi Transaksi GoBiz (Opsional):
                </label>
                <input
                  type="text"
                  value={qrisReference}
                  onChange={(e) => setQrisReference(e.target.value)}
                  placeholder="Contoh: 4 digit terakhir / Ref #8821"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-nyeni-blue/30 focus:border-nyeni-blue"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Petunjuk: Cocokkan dengan notifikasi aplikasi GoBiz kasir untuk validasi transaksi.
                </p>
              </div>
            </div>
          )}

          {paymentMethod === 'transfer' && (
            <div className="p-4 bg-slate-50 rounded-ios-card border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-nyeni-blue" />
                  <span>Rekening Transfer Kasir Resmi</span>
                </span>
                <span className="text-[10px] bg-blue-100 text-nyeni-blue font-bold px-2 py-0.5 rounded-full">
                  BCA Digital
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Bank Tujuan
                  </span>
                  <span className="font-black text-nyeni-navy text-sm">Blu by BCA Digital</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Nomor Rekening
                    </span>
                    <span className="text-base font-black font-mono text-nyeni-blue tracking-wide">
                      000596641881
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText('000596641881');
                        setCopiedBank(true);
                        setTimeout(() => setCopiedBank(false), 2000);
                        notify({
                          type: 'success',
                          title: 'Nomor Rekening Tersalin',
                          message: '000596641881 berhasil disalin ke clipboard.',
                        });
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      copiedBank
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : 'bg-nyeni-blue-soft text-nyeni-blue hover:bg-nyeni-blue hover:text-white'
                    }`}
                  >
                    {copiedBank ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Rek</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Atas Nama:</span>
                  <span className="font-bold text-foreground">Yossika Putra Erlangga</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] font-medium leading-relaxed">
                Pastikan nama pengirim dan bukti mutasi berhasil tampil di m-Banking sebelum menekan tombol konfirmasi bayar.
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-ios flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border bg-slate-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-ios border border-border text-foreground hover:bg-slate-100 text-sm font-semibold transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !isCashValid}
            className="px-6 py-2.5 min-h-[44px] rounded-ios bg-nyeni-blue text-white font-bold text-sm hover:bg-nyeni-blue-hover transition-all shadow-sm active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Konfirmasi Pembayaran</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* QRIS Fullscreen Zoom Modal */}
      {isQrisZoomed && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-sm w-full bg-white rounded-3xl p-4 shadow-2xl border border-white/40 flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsQrisZoomed(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-full aspect-[3/4] relative rounded-2xl overflow-hidden mt-2">
              <Image
                src="/assets/qris-gopay-merchant.webp"
                alt="QRIS GoPay Merchant Magi Nyeni Store"
                fill
                sizes="(max-width: 640px) 90vw, 380px"
                className="object-contain"
                priority
              />
            </div>
            <p className="text-xs font-bold text-nyeni-navy mt-3 text-center">
              Arahkan kamera smartphone ke kode QR di atas
            </p>
            <button
              type="button"
              onClick={() => setIsQrisZoomed(false)}
              className="mt-3 w-full py-2.5 rounded-xl bg-nyeni-navy text-white text-xs font-bold"
            >
              Tutup Tampilan QRIS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
