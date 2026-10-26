'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAuth } from '@/context/auth-context';
import { localDb } from '@/lib/storage/local-db';
import { Ingredient, InventoryMovement, BaseUnit } from '@/types';
import { formatRupiah, formatNumber, formatDateTime } from '@/lib/format';
import {
  Boxes,
  Plus,
  History,
  ShoppingBag,
  Search,
  X,
} from 'lucide-react';

export default function InventoryPage() {
  const { isAdmin, profile } = useAuth();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Adjustment / Waste Modal
  const [adjustingIngredient, setAdjustingIngredient] = useState<Ingredient | null>(null);
  const [adjustType, setAdjustType] = useState<'waste' | 'adjustment_in' | 'adjustment_out'>('waste');
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  // New Ingredient Modal
  const [isNewIngredientOpen, setIsNewIngredientOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBaseUnit, setNewBaseUnit] = useState<BaseUnit>('g');
  const [newPurchaseUnit, setNewPurchaseUnit] = useState('kg');
  const [newConversion, setNewConversion] = useState<number>(1000);
  const [newInitialStock, setNewInitialStock] = useState<number>(0);
  const [newMinStock, setNewMinStock] = useState<number>(0);
  const [newInitialCost, setNewInitialCost] = useState<number>(0);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [newError, setNewError] = useState('');

  const fetchInventory = useCallback(() => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const db = localDb.getDb();
      setIngredients(localDb.getIngredients());
      setMovements([...db.inventory_movements].reverse());
    } catch (err: unknown) {
      console.error('Inventory error:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuat data inventori bahan.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Submit Adjustment / Waste
  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingIngredient || !profile) return;

    if (!adjustReason.trim()) {
      setAdjustError('Alasan penyesuaian stok atau waste wajib diisi.');
      return;
    }

    if (adjustQuantity <= 0) {
      setAdjustError('Jumlah mutasi harus lebih besar dari 0.');
      return;
    }

    const delta = adjustType === 'adjustment_in' ? adjustQuantity : -adjustQuantity;

    if (delta < 0 && Math.abs(delta) > adjustingIngredient.stock_base) {
      setAdjustError('Jumlah pengurangan melebihi stok yang tersedia.');
      return;
    }

    setIsSubmittingAdjust(true);
    setAdjustError('');

    try {
      localDb.recordAdjustment(
        adjustingIngredient.id,
        adjustType,
        delta,
        adjustReason.trim(),
        profile.id
      );

      fetchInventory();
      setAdjustingIngredient(null);
      setAdjustQuantity(0);
      setAdjustReason('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan penyesuaian stok.';
      setAdjustError(msg);
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  // Submit New Ingredient
  const handleSaveNewIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setNewError('Nama bahan baku wajib diisi.');
      return;
    }

    setIsSubmittingNew(true);
    setNewError('');

    try {
      localDb.addIngredient({
        name: newName.trim(),
        base_unit: newBaseUnit,
        purchase_unit: newPurchaseUnit.trim(),
        conversion_to_base: newConversion,
        stock_base: newInitialStock,
        minimum_stock_base: newMinStock,
        average_cost_per_base: newInitialCost,
      });

      fetchInventory();
      setIsNewIngredientOpen(false);
      setNewName('');
      setNewInitialStock(0);
      setNewMinStock(0);
      setNewInitialCost(0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menambahkan bahan baku.';
      setNewError(msg);
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // Filtered ingredients
  const filteredIngredients = useMemo(() => {
    return ingredients.filter((ing) =>
      ing.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [ingredients, searchQuery]);

  return (
    <AppShell>
      <PageHeader
        title="Stok Bahan Baku"
        subtitle="Kelola persediaan bahan dessert cup, pantau mutasi append-only, dan catat waste"
        action={
          isAdmin && (
            <div className="flex items-center gap-2">
              <Link
                href="/inventory/purchases"
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-ios border border-nyeni-blue bg-nyeni-blue-soft text-nyeni-blue font-bold text-xs hover:bg-nyeni-blue hover:text-white transition-colors shadow-xs"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Restock / Pembelian</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsNewIngredientOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-ios bg-nyeni-blue text-white font-bold text-xs hover:bg-nyeni-blue-hover transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Bahan Baru</span>
              </button>
            </div>
          )
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-border pb-3 mb-6">
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex items-center gap-2 px-4 py-2 rounded-ios text-xs font-bold transition-all ${
            activeTab === 'stock'
              ? 'bg-nyeni-navy text-white shadow-xs'
              : 'bg-white text-muted hover:text-foreground border border-border'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Daftar Stok Bahan ({ingredients.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-ios text-xs font-bold transition-all ${
            activeTab === 'movements'
              ? 'bg-nyeni-navy text-white shadow-xs'
              : 'bg-white text-muted hover:text-foreground border border-border'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Mutasi Append-Only</span>
        </button>
      </div>

      {activeTab === 'stock' ? (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-white p-3.5 rounded-ios-card border border-border shadow-ios flex items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama bahan baku (Mangga, Susu, Sago, Cup)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 text-xs rounded-ios border border-border bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-nyeni-blue/30 focus:border-nyeni-blue"
              />
            </div>
          </div>

          {isLoading ? (
            <LoadingSkeleton count={6} className="h-16 w-full" />
          ) : errorMessage ? (
            <ErrorState message={errorMessage} onRetry={fetchInventory} />
          ) : filteredIngredients.length === 0 ? (
            <EmptyState
              icon={Boxes}
              title="Bahan Baku Kosong"
              description="Belum ada bahan baku yang terdaftar di sistem operasional."
            />
          ) : (
            <div className="bg-white rounded-ios-card border border-border shadow-ios overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-border text-muted uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Nama Bahan</th>
                      <th className="px-4 py-3">Satuan Dasar</th>
                      <th className="px-4 py-3">Satuan Pembelian</th>
                      <th className="px-4 py-3 text-right">Stok Saat Ini</th>
                      <th className="px-4 py-3 text-right">Min. Stok</th>
                      <th className="px-4 py-3 text-right">Biaya Satuan Est.</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      {isAdmin && <th className="px-4 py-3 text-center">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredIngredients.map((ing) => {
                      const isLow = Number(ing.stock_base) <= Number(ing.minimum_stock_base);
                      const isOut = Number(ing.stock_base) <= 0;

                      return (
                        <tr key={ing.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3.5 font-bold text-foreground">
                            {ing.name}
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-nyeni-blue">
                            {ing.base_unit}
                          </td>
                          <td className="px-4 py-3.5 text-muted">
                            1 {ing.purchase_unit} = {formatNumber(ing.conversion_to_base)} {ing.base_unit}
                          </td>
                          <td className="px-4 py-3.5 text-right font-black tabular-nums text-foreground">
                            {formatNumber(ing.stock_base)} {ing.base_unit}
                          </td>
                          <td className="px-4 py-3.5 text-right text-muted tabular-nums">
                            {formatNumber(ing.minimum_stock_base)} {ing.base_unit}
                          </td>
                          <td className="px-4 py-3.5 text-right text-muted tabular-nums">
                            {formatRupiah(ing.average_cost_per_base)}/{ing.base_unit}
                          </td>
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <StatusBadge
                              label={isOut ? 'Habis' : isLow ? 'Menipis' : 'Aman'}
                              variant={isOut ? 'danger' : isLow ? 'warning' : 'success'}
                            />
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setAdjustingIngredient(ing);
                                  setAdjustType('waste');
                                  setAdjustQuantity(0);
                                  setAdjustReason('');
                                  setAdjustError('');
                                }}
                                className="px-2.5 py-1 rounded-ios bg-slate-100 hover:bg-nyeni-blue-soft text-slate-700 hover:text-nyeni-blue font-bold text-[11px] transition-colors"
                              >
                                Sesuaikan / Waste
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Movements Tab (Append-only) */
        <div className="bg-white rounded-ios-card border border-border shadow-ios overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-border text-muted uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Bahan</th>
                  <th className="px-4 py-3">Tipe Mutasi</th>
                  <th className="px-4 py-3 text-right">Perubahan (Delta)</th>
                  <th className="px-4 py-3 text-right">Biaya Snapshot</th>
                  <th className="px-4 py-3">Alasan / Referensi</th>
                  <th className="px-4 py-3">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-xs text-muted">
                      Belum ada pergerakan stok tercatat.
                    </td>
                  </tr>
                ) : (
                  movements.map((mov) => {
                    const isPositive = Number(mov.quantity_delta_base) > 0;
                    return (
                      <tr key={mov.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 text-muted whitespace-nowrap">
                          {formatDateTime(mov.created_at)}
                        </td>
                        <td className="px-4 py-3 font-bold text-foreground">
                          {mov.ingredient?.name || 'Bahan'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {mov.movement_type}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-black tabular-nums whitespace-nowrap ${
                            isPositive ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {formatNumber(mov.quantity_delta_base)} {mov.ingredient?.base_unit}
                        </td>
                        <td className="px-4 py-3 text-right text-muted tabular-nums">
                          {formatRupiah(mov.unit_cost_snapshot)}
                        </td>
                        <td className="px-4 py-3 text-foreground max-w-xs truncate">
                          {mov.reason || '-'}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {mov.creator?.full_name || 'Sistem'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Record Stock Adjustment / Waste */}
      {adjustingIngredient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-ios-card shadow-ios-modal border border-border overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-nyeni-navy">Penyesuaian Stok / Waste</h3>
                <p className="text-xs text-muted">{adjustingIngredient.name}</p>
              </div>
              <button
                onClick={() => setAdjustingIngredient(null)}
                className="p-1 rounded-full text-muted hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-4 sm:p-5 space-y-4 text-xs">
              {adjustError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-ios text-rose-700 font-medium">
                  {adjustError}
                </div>
              )}

              {/* Current Stock Banner */}
              <div className="p-3 rounded-ios bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-muted">Stok Tersedia Saat Ini:</span>
                <span className="font-black text-foreground tabular-nums text-sm">
                  {formatNumber(adjustingIngredient.stock_base)} {adjustingIngredient.base_unit}
                </span>
              </div>

              {/* Mutation Type */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Jenis Tindakan <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('waste')}
                    className={`py-2 px-2 rounded-ios border font-bold text-center transition-all ${
                      adjustType === 'waste'
                        ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-xs'
                        : 'border-border bg-white text-muted hover:bg-slate-50'
                    }`}
                  >
                    Waste (Rusak)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('adjustment_out')}
                    className={`py-2 px-2 rounded-ios border font-bold text-center transition-all ${
                      adjustType === 'adjustment_out'
                        ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-xs'
                        : 'border-border bg-white text-muted hover:bg-slate-50'
                    }`}
                  >
                    Koreksi Kurang
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('adjustment_in')}
                    className={`py-2 px-2 rounded-ios border font-bold text-center transition-all ${
                      adjustType === 'adjustment_in'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-xs'
                        : 'border-border bg-white text-muted hover:bg-slate-50'
                    }`}
                  >
                    Koreksi Tambah
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Jumlah Satuan Dasar ({adjustingIngredient.base_unit}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={adjustQuantity || ''}
                  onChange={(e) => setAdjustQuantity(Number(e.target.value) || 0)}
                  placeholder="Contoh: 500"
                  className="w-full px-3 py-2 text-sm font-bold rounded-ios border border-border focus:outline-none focus:ring-2 focus:ring-nyeni-blue"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Alasan Wajib <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Contoh: Buah mangga busuk / Selisih opname fisik..."
                  className="w-full px-3 py-2 text-xs rounded-ios border border-border focus:outline-none focus:ring-2 focus:ring-nyeni-blue"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustingIngredient(null)}
                  className="px-4 py-2 rounded-ios border border-border text-foreground hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="px-5 py-2 rounded-ios bg-nyeni-navy text-white font-bold hover:bg-nyeni-navy-hover transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmittingAdjust ? 'Menyimpan...' : 'Simpan Mutasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Ingredient */}
      {isNewIngredientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-ios-card shadow-ios-modal border border-border overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-bold text-nyeni-navy">Tambah Bahan Baku Baru</h3>
              <button
                onClick={() => setIsNewIngredientOpen(false)}
                className="p-1 rounded-full text-muted hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewIngredient} className="p-4 sm:p-5 space-y-3.5 text-xs">
              {newError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-ios text-rose-700 font-medium">
                  {newError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nama Bahan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jelly Mangga Nyeni"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-ios border border-border focus:outline-none focus:ring-1 focus:ring-nyeni-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Satuan Dasar <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newBaseUnit}
                    onChange={(e) => setNewBaseUnit(e.target.value as BaseUnit)}
                    className="w-full px-3 py-2 text-xs rounded-ios border border-border bg-white focus:outline-none focus:ring-1 focus:ring-nyeni-blue"
                  >
                    <option value="g">Gram (g)</option>
                    <option value="ml">Mililiter (ml)</option>
                    <option value="pcs">Pieces (pcs)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Satuan Pembelian <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: kg, liter, pack"
                    value={newPurchaseUnit}
                    onChange={(e) => setNewPurchaseUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-ios border border-border focus:outline-none focus:ring-1 focus:ring-nyeni-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Faktor Konversi (1 {newPurchaseUnit} = ... {newBaseUnit}){' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newConversion || ''}
                  onChange={(e) => setNewConversion(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-xs rounded-ios border border-border focus:outline-none focus:ring-1 focus:ring-nyeni-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Stok Awal ({newBaseUnit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newInitialStock || ''}
                    onChange={(e) => setNewInitialStock(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs rounded-ios border border-border focus:outline-none focus:ring-1 focus:ring-nyeni-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Batas Minimum Stok ({newBaseUnit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newMinStock || ''}
                    onChange={(e) => setNewMinStock(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs rounded-ios border border-border focus:outline-none focus:ring-1 focus:ring-nyeni-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Biaya Dasar Awal (Rp per {newBaseUnit})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={newInitialCost || ''}
                  onChange={(e) => setNewInitialCost(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs rounded-ios border border-border focus:outline-none focus:ring-1 focus:ring-nyeni-blue"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewIngredientOpen(false)}
                  className="px-4 py-2 rounded-ios border border-border text-foreground hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="px-5 py-2 rounded-ios bg-nyeni-blue text-white font-bold hover:bg-nyeni-blue-hover transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmittingNew ? 'Menyimpan...' : 'Simpan Bahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
