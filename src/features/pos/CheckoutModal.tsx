'use client';

import React, { useState, useEffect } from 'react';
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
                  <span>GoPay Merchant / QRIS</span>
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Siap Scan
                </span>
              </div>

              {/* QR Code Container */}
              <div className="w-36 h-36 mx-auto bg-white border border-slate-300 rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-xs">
                <QrCode className="w-24 h-24 text-slate-800" />
                <span className="text-[9px] font-black text-slate-500 mt-1 uppercase tracking-wider">
                  QRIS GO-PAY / BCA / SHOPEE
                </span>
              </div>

              <p className="text-xs font-bold text-foreground">
                Arahkan pelanggan scan QRIS atau stiker QR GoPay di meja kasir.
              </p>
              <p className="text-xs text-muted">
                Nominal Tagihan:{' '}
                <span className="font-extrabold text-nyeni-navy text-sm">{formatRupiah(total)}</span>
              </p>

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
                  💡 Cocokkan dengan notifikasi aplikasi GoBiz kasir untuk menghindari bukti bayar palsu.
                </p>
              </div>
            </div>
          )}

          {paymentMethod === 'transfer' && (
            <div className="p-4 bg-slate-50 rounded-ios border border-slate-200 space-y-2 text-xs">
              <p className="font-bold text-foreground">Rekening Tujuan Operasional:</p>
              <div className="p-2.5 bg-white rounded-lg border border-border">
                <p className="font-bold text-nyeni-navy">BCA: 8820-9912-34</p>
                <p className="text-slate-600 text-[11px]">a/n Mango Nyeni Official</p>
              </div>
              <p className="text-[11px] text-muted italic">
                Pastikan mutasi transfer telah masuk sebelum mengonfirmasi transaksi.
              </p>
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
    </div>
  );
}
