'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAuth } from '@/context/auth-context';
import { localDb } from '@/lib/storage/local-db';
import { Product, ProductVariant, Addon, Ingredient } from '@/types';
import { formatRupiah, formatNumber } from '@/lib/format';
import { ResponsiveProductImage } from '@/components/ui/ResponsiveProductImage';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  X,
  Loader2,
} from 'lucide-react';

export default function MenuPage() {
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Recipe Editor Modal
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [recipeLines, setRecipeLines] = useState<
    Array<{ ingredient_id: string; quantity: number }>
  >([]);
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);
  const [recipeError, setRecipeError] = useState('');

  // Edit Price Modal
  const [editingPriceVariant, setEditingPriceVariant] = useState<ProductVariant | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  const fetchMenuData = useCallback(() => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const db = localDb.getDb();
      setProducts(localDb.getProductsWithVariants());
      setAddons(db.addons || []);
      setIngredients(localDb.getIngredients());
    } catch (err: unknown) {
      console.error('Menu fetch error:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuat katalog menu & resep.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  // Open recipe editor
  const handleOpenRecipeEditor = (variant: ProductVariant) => {
    setEditingVariant(variant);
    const existing = (variant.recipe_items || []).map((item) => ({
      ingredient_id: item.ingredient_id,
      quantity: item.quantity_base_per_serving,
    }));
    setRecipeLines(existing);
    setRecipeError('');
  };

  const handleAddRecipeLine = () => {
    if (ingredients.length === 0) return;
    setRecipeLines((prev) => [
      ...prev,
      { ingredient_id: ingredients[0].id, quantity: 10 },
    ]);
  };

  const handleUpdateRecipeLine = (
    index: number,
    ingredientId: string,
    quantity: number
  ) => {
    setRecipeLines((prev) => {
      const next = [...prev];
      next[index] = { ingredient_id: ingredientId, quantity };
      return next;
    });
  };

  const handleRemoveRecipeLine = (index: number) => {
    setRecipeLines((prev) => prev.filter((_, i) => i !== index));
  };

  // Save recipe
  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;

    if (recipeLines.length === 0) {
      setRecipeError('Tambahkan minimal 1 bahan baku untuk melengkapi resep.');
      return;
    }

    const ingIds = recipeLines.map((l) => l.ingredient_id);
    if (new Set(ingIds).size !== ingIds.length) {
      setRecipeError('Terdapat bahan baku ganda. Gabungkan takaran bahan yang sama.');
      return;
    }

    setIsSavingRecipe(true);
    setRecipeError('');

    try {
      localDb.updateRecipe(editingVariant.id, recipeLines);
      fetchMenuData();
      setEditingVariant(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan resep varian.';
      setRecipeError(msg);
    } finally {
      setIsSavingRecipe(false);
    }
  };

  // Save price edit
  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPriceVariant) return;

    if (newPrice < 0) {
      alert('Harga tidak boleh negatif.');
      return;
    }

    setIsSavingPrice(true);

    try {
      localDb.updateVariantPrice(editingPriceVariant.id, newPrice);
      fetchMenuData();
      setEditingPriceVariant(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal memperbarui harga.');
    } finally {
      setIsSavingPrice(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Menu & Editor Resep"
        subtitle="Atur daftar harga resmi dan lengkapi formula takaran bahan nyata per cup dessert"
      />

      {/* Guidelines alert */}
      <div className="mb-6 p-4 rounded-ios-card bg-nyeni-blue-soft/50 border border-nyeni-blue/20 text-nyeni-navy text-xs flex items-start gap-3">
        <BookOpen className="w-5 h-5 text-nyeni-blue shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Standar Akurasi HPP & Stok Bahan</p>
          <p className="text-muted mt-0.5 leading-relaxed">
            Sistem telah dilengkapi resep takaran dasar terstandar. Anda dapat mengedit takaran bahan nyata kapan saja di bawah ini agar pengurangan stok dan HPP otomatis menyesuaikan resep dapur Anda.
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={3} className="h-44 w-full" />
      ) : errorMessage ? (
        <ErrorState message={errorMessage} onRetry={fetchMenuData} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="Katalog Menu Kosong"
          description="Klik reset database di Pengaturan untuk memuat produk default."
        />
      ) : (
        <div className="space-y-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-ios-card border border-border shadow-ios p-5 sm:p-6"
            >
              {/* Product Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-border relative overflow-hidden flex items-center justify-center p-1 shrink-0">
                    <ResponsiveProductImage
                      src={product.image_path}
                      alt={product.name}
                      size="sm"
                      allowZoom={true}
                      className="w-full h-full"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-nyeni-blue uppercase tracking-wider block">
                      {product.category}
                    </span>
                    <h2 className="text-lg font-black text-nyeni-navy">{product.name}</h2>
                    <p className="text-xs text-muted max-w-xl mt-0.5">
                      {product.description || 'Pilihan dessert segar khas Mango Nyeni.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Variants Grid */}
              <div className="mt-4">
                <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
                  Varian Ukuran, Harga & Formula Resep
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(product.variants || []).map((variant) => {
                    const hasRecipe =
                      variant.recipe_items && variant.recipe_items.length > 0;

                    return (
                      <div
                        key={variant.id}
                        className={`p-3.5 rounded-ios border transition-all flex flex-col justify-between ${
                          hasRecipe
                            ? 'border-border bg-slate-50/40'
                            : 'border-amber-200 bg-amber-50/40'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <span className="text-sm font-bold text-foreground">
                              {variant.name}
                            </span>
                            <StatusBadge
                              label={hasRecipe ? 'Resep Lengkap' : 'Belum Ada'}
                              variant={hasRecipe ? 'success' : 'warning'}
                              icon={false}
                            />
                          </div>

                          <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-base font-black text-nyeni-navy tabular-nums">
                              {formatRupiah(variant.price_idr)}
                            </span>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPriceVariant(variant);
                                  setNewPrice(variant.price_idr);
                                }}
                                className="text-[11px] font-semibold text-nyeni-blue hover:underline"
                              >
                                Edit Harga
                              </button>
                            )}
                          </div>

                          {/* Recipe Summary */}
                          <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[11px]">
                            {hasRecipe ? (
                              <div className="space-y-0.5 text-slate-700">
                                {variant.recipe_items!.map((item) => (
                                  <div key={item.id} className="flex justify-between">
                                    <span className="truncate pr-1">
                                      {item.ingredient?.name}
                                    </span>
                                    <span className="font-semibold text-nyeni-blue shrink-0 tabular-nums">
                                      {formatNumber(item.quantity_base_per_serving)}{' '}
                                      {item.ingredient?.base_unit}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-amber-800 italic text-[11px]">
                                Takaran resep belum dimasukkan. Penjualan diblokir sampai resep diatur.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action */}
                        {isAdmin && (
                          <div className="mt-3 pt-2">
                            <button
                              type="button"
                              onClick={() => handleOpenRecipeEditor(variant)}
                              className="w-full py-2 rounded-lg bg-white border border-border text-foreground hover:bg-nyeni-blue hover:text-white hover:border-nyeni-blue font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>{hasRecipe ? 'Ubah Resep' : 'Atur Resep Sekarang'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* Add-ons Section */}
          <div className="bg-white rounded-ios-card border border-border shadow-ios p-5 sm:p-6">
            <h3 className="text-base font-black text-nyeni-navy mb-1">Add-on Resmi</h3>
            <p className="text-xs text-muted mb-4">
              Pilihan topping tambahan per cup dessert
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {addons.map((addon) => (
                <div
                  key={addon.id}
                  className="p-4 rounded-ios border border-border bg-slate-50/40 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-nyeni-blue-soft text-nyeni-blue flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{addon.name}</h4>
                      <p className="text-xs font-black text-nyeni-navy tabular-nums mt-0.5">
                        +{formatRupiah(addon.price_idr)}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    Aktif
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Recipe Editor */}
      {editingVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-ios-card shadow-ios-modal border border-border overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-nyeni-navy">
                  Atur Resep — {editingVariant.name}
                </h3>
                <p className="text-xs text-muted">
                  Tentukan jumlah konsumsi bahan baku satuan dasar per 1 porsi cup
                </p>
              </div>
              <button
                onClick={() => setEditingVariant(null)}
                className="p-1 rounded-full text-muted hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              {recipeError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-ios text-rose-700 font-medium">
                  {recipeError}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="font-bold text-muted uppercase tracking-wider text-[11px]">
                  Bahan Baku Terpakai
                </span>
                <button
                  type="button"
                  onClick={handleAddRecipeLine}
                  className="text-xs font-bold text-nyeni-blue hover:text-nyeni-blue-hover flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Bahan</span>
                </button>
              </div>

              {recipeLines.length === 0 ? (
                <div className="p-6 text-center text-muted bg-slate-50 rounded-ios border border-dashed border-slate-200">
                  <p className="font-bold text-xs text-foreground mb-1">Resep Belum Diatur</p>
                  <p className="text-[11px] mb-3">Klik tombol Tambah Bahan di atas untuk memasukkan komposisi takaran.</p>
                  <button
                    type="button"
                    onClick={handleAddRecipeLine}
                    className="px-3 py-1.5 rounded-lg bg-nyeni-blue text-white font-bold text-xs"
                  >
                    Tambah Bahan Pertama
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recipeLines.map((line, idx) => {
                    const ing = ingredients.find((i) => i.id === line.ingredient_id);
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-ios border border-slate-200 bg-slate-50/50 flex items-center gap-2"
                      >
                        <div className="flex-1">
                          <label className="block text-[10px] text-muted font-bold mb-0.5">Bahan</label>
                          <select
                            value={line.ingredient_id}
                            onChange={(e) =>
                              handleUpdateRecipeLine(idx, e.target.value, line.quantity)
                            }
                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-border bg-white font-semibold"
                          >
                            {ingredients.map((i) => (
                              <option key={i.id} value={i.id}>
                                {i.name} ({i.base_unit})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-32">
                          <label className="block text-[10px] text-muted font-bold mb-0.5">
                            Takaran ({ing?.base_unit || 'unit'})
                          </label>
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            required
                            value={line.quantity || ''}
                            onChange={(e) =>
                              handleUpdateRecipeLine(
                                idx,
                                line.ingredient_id,
                                Number(e.target.value) || 0
                              )
                            }
                            className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-border bg-white text-right tabular-nums"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveRecipeLine(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors mt-3"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingVariant(null)}
                  className="px-4 py-2.5 rounded-ios border border-border text-foreground hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingRecipe || recipeLines.length === 0}
                  className="px-6 py-2.5 rounded-ios bg-nyeni-navy text-white font-bold hover:bg-nyeni-navy-hover transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingRecipe ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Resep Varian</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Variant Price */}
      {editingPriceVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-ios-card shadow-ios-modal border border-border overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-bold text-nyeni-navy">
                Ubah Harga — {editingPriceVariant.name}
              </h3>
              <button
                onClick={() => setEditingPriceVariant(null)}
                className="p-1 rounded-full text-muted hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrice} className="p-4 sm:p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Harga Baru (Rupiah) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  value={newPrice || ''}
                  onChange={(e) => setNewPrice(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 text-base font-bold rounded-ios border border-border tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-nyeni-blue"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPriceVariant(null)}
                  className="px-4 py-2 rounded-ios border border-border text-foreground hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingPrice}
                  className="px-5 py-2 rounded-ios bg-nyeni-blue text-white font-bold hover:bg-nyeni-blue-hover transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSavingPrice ? 'Menyimpan...' : 'Perbarui Harga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
