'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/context/auth-context';
import { localDb } from '@/lib/storage/local-db';
import { Ingredient, StockPurchase } from '@/types';
import { formatRupiah, formatNumber, formatDate, generatePurchaseNumber } from '@/lib/format';
import {
  ShoppingBag,
  Plus,
  ArrowLeft,
  X,
  Trash2,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface PurchaseLine {
  ingredient_id: string;
  ingredient_name: string;
  purchase_quantity: number;
  purchase_unit: string;
  conversion_to_base: number;
  base_unit: string;
  unit_cost_idr: number;
  line_total_idr: number;
}

export default function PurchasesPage() {
  const { isAdmin, profile } = useAuth();

  const [purchases, setPurchases] = useState<StockPurchase[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // New Purchase Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid');
  const [purchaseLines, setPurchaseLines] = useState<PurchaseLine[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchData = useCallback(() => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const db = localDb.getDb();
      setPurchases([...db.stock_purchases].reverse());
      setIngredients(localDb.getIngredients());
    } catch (err: unknown) {
      console.error('Purchases fetch error:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuat histori pembelian bahan.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddLine = () => {
    if (ingredients.length === 0) return;
    const defaultIng = ingredients[0];
    setPurchaseLines((prev) => [
      ...prev,
      {
        ingredient_id: defaultIng.id,
        ingredient_name: defaultIng.name,
        purchase_quantity: 1,
        purchase_unit: defaultIng.purchase_unit,
        conversion_to_base: defaultIng.conversion_to_base,
        base_unit: defaultIng.base_unit,
        unit_cost_idr: 0,
        line_total_idr: 0,
      },
    ]);
  };

  const handleUpdateLine = (index: number, updates: Partial<PurchaseLine>) => {
    setPurchaseLines((prev) => {
      const next = [...prev];
      const current = { ...next[index], ...updates };

      if (updates.ingredient_id) {
        const found = ingredients.find((i) => i.id === updates.ingredient_id);
        if (found) {
          current.ingredient_name = found.name;
          current.purchase_unit = found.purchase_unit;
          current.conversion_to_base = found.conversion_to_base;
          current.base_unit = found.base_unit;
        }
      }

      current.line_total_idr = current.purchase_quantity * current.unit_cost_idr;
      next[index] = current;
      return next;
    });
  };

  const handleRemoveLine = (index: number) => {
    setPurchaseLines((prev) => prev.filter((_, i) => i !== index));
  };

  const totalCost = purchaseLines.reduce((acc, l) => acc + l.line_total_idr, 0);

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (purchaseLines.length === 0) {
      setModalError('Tambahkan minimal satu bahan yang dibeli.');
      return;
    }

    for (const l of purchaseLines) {
      if (l.purchase_quantity <= 0) {
        setModalError(`Jumlah pembelian untuk "${l.ingredient_name}" harus lebih dari 0.`);
        return;
      }
      if (l.unit_cost_idr < 0) {
        setModalError(`Biaya satuan untuk "${l.ingredient_name}" tidak boleh negatif.`);
        return;
      }
    }

    setIsSubmitting(true);
    setModalError('');

    const purchaseNumber = generatePurchaseNumber();

    try {
      localDb.recordPurchase(
        purchaseNumber,
        supplierName.trim() || null,
        purchaseDate,
        paymentStatus,
        purchaseNotes.trim() || null,
        purchaseLines,
        profile.id
      );

      fetchData();
      setIsModalOpen(false);
      setSupplierName('');
      setPurchaseNotes('');
      setPurchaseLines([]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mencatat pembelian stok.';
      setModalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="mb-2">
        <Link
          href="/inventory"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-nyeni-blue hover:text-nyeni-blue-hover transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Stok Bahan</span>
        </Link>
      </div>

      <PageHeader
        title="Pembelian Bahan Baku (Restock)"
        subtitle="Catat penerimaan stok baru, hitung konversi satuan, dan perbarui biaya rata-rata tertimbang"
        action={
          isAdmin && (
            <button
              onClick={() => {
                setIsModalOpen(true);
                setPurchaseLines([]);
                handleAddLine();
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-ios bg-nyeni-blue text-white font-bold text-xs hover:bg-nyeni-blue-hover transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Pembelian Baru</span>
            </button>
          )
        }
      />

      {isLoading ? (
        <LoadingSkeleton count={5} className="h-20 w-full" />
      ) : errorMessage ? (
        <ErrorState message={errorMessage} onRetry={fetchData} />
      ) : purchases.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Belum Ada Pembelian Stok"
          description="Catat pembelian bahan baku agar stok bertambah dan biaya HPP terhitung akurat."
          action={
            isAdmin
              ? {
                  label: 'Catat Pembelian Pertama',
                  onClick: () => {
                    setIsModalOpen(true);
                    handleAddLine();
                  },
                }
              : undefined
          }
        />
      ) : (
        <div className="bg-white rounded-ios-card border border-border shadow-ios overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-border text-muted uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">No. Pembelian</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Pemasok (Supplier)</th>
                  <th className="px-4 py-3">Bahan Masuk</th>
                  <th className="px-4 py-3">Status Bayar</th>
                  <th className="px-4 py-3 text-right">Total Biaya</th>
                  <th className="px-4 py-3">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {purchases.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-nyeni-navy">
                      {po.purchase_number}
                    </td>
                    <td className="px-4 py-3.5 text-muted whitespace-nowrap">
                      {formatDate(po.purchase_date)}
                    </td>
                    <td className="px-4 py-3.5 text-foreground">
                      {po.supplier_name || 'Umum'}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        {(po.items || []).map((item, idx) => (
                          <div key={idx} className="text-[11px] text-slate-700">
                            {formatNumber(item.purchase_quantity)} {item.purchase_unit_snapshot}{' '}
                            <span className="font-bold">{item.ingredient?.name}</span> (={formatNumber(item.base_quantity)} {item.ingredient?.base_unit})
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusBadge
                        label={po.payment_status === 'paid' ? 'Lunas' : 'Pending'}
                        variant={po.payment_status === 'paid' ? 'success' : 'warning'}
                      />
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-nyeni-navy tabular-nums text-sm whitespace-nowrap">
                      {formatRupiah(po.total_cost_idr)}
                    </td>
                    <td className="px-4 py-3.5 text-muted whitespace-nowrap">
                      {po.creator?.full_name || 'Admin'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Purchase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-ios-card shadow-ios-modal border border-border overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-nyeni-navy">Penerimaan Stok Bahan (PO)</h3>
                <p className="text-xs text-muted">Stok akan bertambah dan HPP rata-rata diperbarui otomatis</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-muted hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPurchase} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-ios text-rose-700 font-medium">
                  {modalError}
                </div>
              )}

              {/* Header Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Tanggal Pembelian <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-ios border border-border bg-white focus:outline-none focus:ring-1 focus:ring-nyeni-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Nama Supplier / Pasar
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Toko Buah Segar"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-ios border border-border bg-white focus:outline-none focus:ring-1 focus:ring-nyeni-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Status Pembayaran
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-ios border border-border bg-white focus:outline-none focus:ring-1 focus:ring-nyeni-blue"
                  >
                    <option value="paid">Lunas (Dibayar)</option>
                    <option value="pending">Hutang / Pending</option>
                  </select>
                </div>
              </div>

              {/* Purchase Lines */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider">
                    Daftar Bahan Yang Diterima
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs font-bold text-nyeni-blue hover:text-nyeni-blue-hover flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {purchaseLines.map((line, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-ios border border-slate-200 bg-slate-50/50 space-y-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        {/* Select Ingredient (5 cols) */}
                        <div className="sm:col-span-5">
                          <label className="block text-[10px] text-muted font-bold mb-0.5">Bahan</label>
                          <select
                            value={line.ingredient_id}
                            onChange={(e) => handleUpdateLine(idx, { ingredient_id: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-border bg-white font-semibold"
                          >
                            {ingredients.map((ing) => (
                              <option key={ing.id} value={ing.id}>
                                {ing.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity (2 cols) */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-muted font-bold mb-0.5">
                            Qty ({line.purchase_unit})
                          </label>
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={line.purchase_quantity || ''}
                            onChange={(e) =>
                              handleUpdateLine(idx, { purchase_quantity: Number(e.target.value) || 0 })
                            }
                            className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-border bg-white text-right tabular-nums"
                          />
                        </div>

                        {/* Unit Cost (3 cols) */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] text-muted font-bold mb-0.5">
                            Biaya/Unit (Rp)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="500"
                            value={line.unit_cost_idr || ''}
                            placeholder="0"
                            onChange={(e) =>
                              handleUpdateLine(idx, { unit_cost_idr: Number(e.target.value) || 0 })
                            }
                            className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-border bg-white text-right tabular-nums"
                          />
                        </div>

                        {/* Remove line (2 cols) */}
                        <div className="sm:col-span-2 flex items-center justify-between pt-3 sm:pt-0">
                          <span className="font-black text-nyeni-navy tabular-nums text-xs">
                            {formatRupiah(line.line_total_idr)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Conversion preview */}
                      <p className="text-[10px] text-slate-500 italic">
                        Masuk ke stok dasar:{' '}
                        <span className="font-bold text-nyeni-blue">
                          {formatNumber(line.purchase_quantity * line.conversion_to_base)} {line.base_unit}
                        </span>{' '}
                        (Rp{Math.round((line.unit_cost_idr / line.conversion_to_base) * 10) / 10}/{line.base_unit})
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation */}
              <div className="p-3 bg-nyeni-blue-soft/60 rounded-ios border border-nyeni-blue/20 flex justify-between items-center">
                <span className="font-bold text-nyeni-navy text-xs uppercase tracking-wider">
                  Total Biaya Pembelian:
                </span>
                <span className="text-lg font-black text-nyeni-navy tabular-nums">
                  {formatRupiah(totalCost)}
                </span>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Catatan / Keterangan PO
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pembelian mangga kualitas super untuk akhir pekan"
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-ios border border-border bg-white focus:outline-none focus:ring-1 focus:ring-nyeni-blue"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-ios border border-border text-foreground hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || purchaseLines.length === 0}
                  className="px-6 py-2.5 rounded-ios bg-nyeni-navy text-white font-bold hover:bg-nyeni-navy-hover transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Konfirmasi & Tambah Stok</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
