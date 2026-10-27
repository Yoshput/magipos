'use client';

import React, { useState, useEffect } from 'react';
import { Product, Addon } from '@/types';
import { formatRupiah } from '@/lib/format';
import { useCart } from '@/context/cart-context';
import { useNotification } from '@/context/notification-context';
import { X, Check, AlertCircle, ShoppingCart } from 'lucide-react';
import { ResponsiveProductImage } from '@/components/ui/ResponsiveProductImage';

interface VariantSelectorModalProps {
  product: Product | null;
  addons: Addon[];
  onClose: () => void;
  onAdded?: () => void;
  onOpenCart?: () => void;
}

export function VariantSelectorModal({
  product,
  addons,
  onClose,
  onAdded,
  onOpenCart,
}: VariantSelectorModalProps) {
  const { addItem } = useCart();
  const { notify } = useNotification();

  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  // Reset state whenever active product changes to prevent state leakage
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const active = product.variants.filter((v) => v.is_active);
      setSelectedVariantId(active.length > 0 ? active[0].id : product.variants[0].id);
    } else {
      setSelectedVariantId('');
    }
    setSelectedAddonIds([]);
  }, [product]);

  if (!product) return null;

  const activeVariants = (product.variants || []).filter((v) => v.is_active);
  const selectedVariant =
    activeVariants.find((v) => v.id === selectedVariantId) || activeVariants[0];

  const hasRecipe =
    selectedVariant?.recipe_items !== undefined && selectedVariant.recipe_items.length > 0;

  const handleToggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const selectedAddonsList = addons.filter((a) => selectedAddonIds.includes(a.id));
  const addonsTotal = selectedAddonsList.reduce((acc, a) => acc + a.price_idr, 0);
  const totalPrice = (selectedVariant?.price_idr || 0) + addonsTotal;

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    // Subtle tactile feedback on supported iOS & Android devices
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch {
        // Ignore devices that block vibration
      }
    }

    addItem(selectedVariant, product, selectedAddonsList, Boolean(hasRecipe));

    notify({
      type: 'success',
      title: 'Item Masuk Keranjang',
      message: `${product.name} (${selectedVariant.name}) berhasil ditambahkan.`,
    });

    onClose();
    if (onAdded) {
      onAdded();
    } else if (onOpenCart) {
      onOpenCart();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-ios-card shadow-ios-modal border border-border overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-slate-50 border border-border p-1 relative overflow-hidden flex items-center justify-center shrink-0">
              <ResponsiveProductImage
                src={product.image_path}
                alt={product.name}
                size="md"
                allowZoom={true}
                className="w-full h-full"
              />
            </div>
            <div>
              <h3 className="text-base font-bold text-nyeni-navy">{product.name}</h3>
              <p className="text-xs text-muted">{product.category} &bull; Ketuk foto untuk zoom</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-muted hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Selection View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Variant / Size Selection */}
          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2.5">
              Pilih Ukuran Cup <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {activeVariants.map((v) => {
                const isSelected = selectedVariant?.id === v.id;
                const vHasRecipe = v.recipe_items && v.recipe_items.length > 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`p-3 rounded-ios border text-left transition-all relative active:scale-[0.98] ${
                      isSelected
                        ? 'border-nyeni-blue bg-nyeni-blue-soft/60 shadow-xs'
                        : 'border-border hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-bold text-foreground">{v.name}</span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-nyeni-blue text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="block text-xs font-bold text-nyeni-blue mt-1">
                      {formatRupiah(v.price_idr)}
                    </span>
                    {!vHasRecipe && (
                      <span className="inline-block mt-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                        Resep standar
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add-ons Selection */}
          {addons.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2.5">
                Pilih Add-on (Opsional)
              </label>
              <div className="space-y-2">
                {addons
                  .filter((a) => a.is_active)
                  .map((a) => {
                    const isChecked = selectedAddonIds.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => handleToggleAddon(a.id)}
                        className={`w-full p-3 rounded-ios border text-left flex items-center justify-between transition-all active:scale-[0.99] ${
                          isChecked
                            ? 'border-nyeni-mango bg-nyeni-mango-soft/50 shadow-xs'
                            : 'border-border hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                              isChecked
                                ? 'bg-nyeni-navy border-nyeni-navy text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className="text-sm font-semibold text-foreground">{a.name}</span>
                        </div>
                        <span className="text-xs font-bold text-nyeni-navy">
                          +{formatRupiah(a.price_idr)}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Recipe Informative Banner (Non-blocking) */}
          {!hasRecipe && (
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-ios flex items-start gap-2.5 text-blue-900">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold">Resep Estimasi / Belum Dikonfigurasi Admin</p>
                <p className="text-blue-700 mt-0.5">
                  Item tetap dapat dipesan dan dijual kasir. Pengurangan stok bahan baku akan dilewati hingga admin mengisi takaran resmi di menu Resep.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted block">Total Harga</span>
            <span className="text-lg font-black text-nyeni-navy">
              {formatRupiah(totalPrice)}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-ios border border-border text-foreground hover:bg-slate-100 text-sm font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!selectedVariant}
              className="px-5 py-2.5 rounded-ios bg-nyeni-blue text-white text-sm font-bold hover:bg-nyeni-blue-hover transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Tambah Keranjang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
