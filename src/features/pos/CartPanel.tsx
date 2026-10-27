'use client';

import React from 'react';
import { useCart } from '@/context/cart-context';
import { formatRupiah } from '@/lib/format';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  Tag,
  X,
} from 'lucide-react';

interface CartPanelProps {
  onCheckout: () => void;
  onClose?: () => void;
  className?: string;
}

export function CartPanel({ onCheckout, onClose, className = '' }: CartPanelProps) {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    discountIdr,
    setDiscountIdr,
    subtotal,
    total,
    totalCups,
  } = useCart();

  return (
    <div
      className={`bg-white rounded-ios-card border border-border shadow-ios flex flex-col h-full overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-nyeni-blue-soft text-nyeni-blue flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-nyeni-navy">Keranjang</h2>
            <span className="text-xs text-muted font-medium">
              {totalCups} cup dipilih
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded transition-colors"
            >
              Kosongkan
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              title="Tutup Keranjang"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted">
            <ShoppingBag className="w-12 h-12 text-slate-300 mb-2 stroke-[1.5]" />
            <p className="text-sm font-bold text-foreground">Keranjang Masih Kosong</p>
            <p className="text-xs text-muted mt-1 max-w-[200px]">
              Ketuk menu di samping untuk memilih varian dan add-on.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const addonsTotal = item.addons.reduce(
              (acc, a) => acc + a.unit_price_idr * a.quantity,
              0
            );
            const lineTotal = (item.unit_price_idr + addonsTotal) * item.quantity;

            return (
              <div
                key={item.id}
                className="p-3 rounded-ios border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition-colors flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-foreground truncate">
                      {item.product_name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-semibold text-nyeni-blue bg-nyeni-blue-soft px-1.5 py-0.5 rounded">
                        {item.variant_name}
                      </span>
                      <span className="text-xs text-muted">
                        @{formatRupiah(item.unit_price_idr)}
                      </span>
                    </div>

                    {/* Addons List */}
                    {item.addons.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {item.addons.map((a) => (
                          <div
                            key={a.addon_id}
                            className="text-[11px] text-amber-700 flex items-center gap-1 font-medium"
                          >
                            <Sparkles className="w-3 h-3 text-nyeni-mango" />
                            <span>
                              {a.addon_name} (+{formatRupiah(a.unit_price_idr)})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Hapus Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Quantity and Price */}
                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-foreground tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-sm font-black text-nyeni-navy tabular-nums">
                    {formatRupiah(lineTotal)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Calculation & Checkout */}
      {items.length > 0 && (
        <div className="p-4 sm:p-5 border-t border-border bg-slate-50/70 space-y-3">
          {/* Subtotal */}
          <div className="flex justify-between text-xs text-muted font-medium">
            <span>Subtotal</span>
            <span className="font-bold text-foreground tabular-nums">
              {formatRupiah(subtotal)}
            </span>
          </div>

          {/* Discount Field */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted font-medium">
              <Tag className="w-3.5 h-3.5" />
              <span>Diskon (Rp)</span>
            </div>
            <input
              type="number"
              min="0"
              max={subtotal}
              step="500"
              value={discountIdr || ''}
              placeholder="0"
              onChange={(e) => setDiscountIdr(Number(e.target.value) || 0)}
              className="w-24 px-2 py-1 text-right text-xs font-bold rounded-lg border border-border bg-white focus:outline-none focus:ring-1 focus:ring-nyeni-blue tabular-nums"
            />
          </div>

          {/* Total */}
          <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-muted block uppercase tracking-wider">
                Total Tagihan
              </span>
              <span className="text-xl sm:text-2xl font-black text-nyeni-navy tabular-nums">
                {formatRupiah(total)}
              </span>
            </div>

            <button
              onClick={onCheckout}
              disabled={items.length === 0}
              className="px-6 py-3.5 min-h-[48px] rounded-ios bg-nyeni-blue text-white font-bold text-sm hover:bg-nyeni-blue-hover transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
            >
              <span>Bayar</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
