'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/context/auth-context';
import { localDb } from '@/lib/storage/local-db';
import { Expense, ExpenseCategory, PaymentMethod } from '@/types';
import { formatRupiah, formatDate } from '@/lib/format';
import {
  Wallet,
  Plus,
  Trash2,
  Search,
  X,
  Loader2,
} from 'lucide-react';

export default function ExpensesPage() {
  const { isAdmin, profile } = useAuth();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New Expense Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>('transportasi');
  const [description, setDescription] = useState('');
  const [amountIdr, setAmountIdr] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Void Expense
  const [expenseToVoid, setExpenseToVoid] = useState<Expense | null>(null);
  const [isVoiding, setIsVoiding] = useState(false);

  const fetchExpenses = useCallback(() => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const db = localDb.getDb();
      setExpenses([...db.expenses].reverse());
    } catch (err: unknown) {
      console.error('Expenses error:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuat daftar pengeluaran.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!description.trim()) {
      setModalError('Keterangan pengeluaran wajib diisi.');
      return;
    }
    if (amountIdr <= 0) {
      setModalError('Nominal pengeluaran harus lebih besar dari Rp 0.');
      return;
    }

    setIsSubmitting(true);
    setModalError('');

    try {
      localDb.recordExpense({
        category,
        description: description.trim(),
        amount_idr: amountIdr,
        expense_date: expenseDate,
        payment_method: paymentMethod,
        created_by: profile.id,
      });

      fetchExpenses();
      setIsModalOpen(false);
      setDescription('');
      setAmountIdr(0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mencatat pengeluaran.';
      setModalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmVoid = async (reason?: string) => {
    if (!expenseToVoid || !reason || !profile) return;
    setIsVoiding(true);

    try {
      localDb.voidExpense(expenseToVoid.id, profile.id, reason);
      fetchExpenses();
      setExpenseToVoid(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal membatalkan pengeluaran.');
    } finally {
      setIsVoiding(false);
    }
  };

  const categoryLabels: Record<ExpenseCategory, string> = {
    transportasi: 'Transportasi',
    listrik_air: 'Listrik & Air',
    promosi: 'Promosi / Marketing',
    perlengkapan_non_stok: 'Perlengkapan Non-Stok',
    biaya_platform: 'Biaya Platform',
    lainnya: 'Lainnya',
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchCat = categoryFilter === 'all' || e.category === categoryFilter;
      const matchSearch =
        e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.creator?.full_name &&
          e.creator.full_name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [expenses, categoryFilter, searchQuery]);

  const totalActiveExpenses = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.status === 'active')
      .reduce((acc, e) => acc + e.amount_idr, 0);
  }, [filteredExpenses]);

  return (
    <AppShell>
      <PageHeader
        title="Pengeluaran Operasional"
        subtitle="Pencatatan biaya operasional harian di luar pembelian persediaan bahan baku"
        action={
          isAdmin && (
            <button
              onClick={() => {
                setIsModalOpen(true);
                setDescription('');
                setAmountIdr(0);
                setModalError('');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-ios bg-nyeni-blue text-white font-bold text-xs hover:bg-nyeni-blue-hover transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Pengeluaran</span>
            </button>
          )
        }
      />

      {/* Summary Banner */}
      <div className="bg-white p-4 rounded-ios-card border border-border shadow-ios mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-muted uppercase tracking-wider block">
            Total Biaya Operasional (Sesuai Filter)
          </span>
          <span className="text-xl sm:text-2xl font-black text-rose-600 tabular-nums">
            {formatRupiah(totalActiveExpenses)}
          </span>
        </div>

        <div className="flex gap-2">
          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-ios border border-border bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-nyeni-blue"
          >
            <option value="all">Semua Kategori</option>
            <option value="transportasi">Transportasi</option>
            <option value="listrik_air">Listrik & Air</option>
            <option value="promosi">Promosi</option>
            <option value="perlengkapan_non_stok">Perlengkapan Non-Stok</option>
            <option value="biaya_platform">Biaya Platform</option>
            <option value="lainnya">Lainnya</option>
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs rounded-ios border border-border bg-white focus:outline-none focus:ring-1 focus:ring-nyeni-blue"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={5} className="h-16 w-full" />
      ) : errorMessage ? (
        <ErrorState message={errorMessage} onRetry={fetchExpenses} />
      ) : filteredExpenses.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Belum Ada Pengeluaran"
          description="Catat pengeluaran operasional seperti listrik, transportasi, atau perlengkapan non-stok."
          action={
            isAdmin
              ? {
                  label: 'Catat Pengeluaran Pertama',
                  onClick: () => setIsModalOpen(true),
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
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Deskripsi / Keterangan</th>
                  <th className="px-4 py-3">Metode Bayar</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Nominal</th>
                  <th className="px-4 py-3">Petugas</th>
                  {isAdmin && <th className="px-4 py-3 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 text-muted whitespace-nowrap">
                      {formatDate(exp.expense_date)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-foreground">
                        {categoryLabels[exp.category] || exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 max-w-xs">
                      {exp.description}
                      {exp.status === 'void' && (
                        <p className="text-[10px] text-rose-600 mt-0.5 italic">
                          Alasan void: {exp.void_reason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 uppercase font-semibold text-nyeni-blue whitespace-nowrap">
                      {exp.payment_method}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusBadge
                        label={exp.status === 'active' ? 'Aktif' : 'Batal'}
                        variant={exp.status === 'active' ? 'success' : 'danger'}
                      />
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-foreground tabular-nums text-sm whitespace-nowrap">
                      {formatRupiah(exp.amount_idr)}
                    </td>
                    <td className="px-4 py-3.5 text-muted whitespace-nowrap">
                      {exp.creator?.full_name || 'Admin'}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {exp.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => setExpenseToVoid(exp)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Batalkan Pengeluaran"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-ios-card shadow-ios-modal border border-border overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-bold text-nyeni-navy">Catat Pengeluaran Operasional</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-muted hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="p-4 sm:p-5 space-y-3.5 text-xs">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-ios text-rose-700 font-medium">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Tanggal <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-ios border border-border bg-white focus:outline-none focus:ring-1 focus:ring-nyeni-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Kategori <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 text-xs rounded-ios border border-border bg-white focus:outline-none focus:ring-1 focus:ring-nyeni-blue font-semibold"
                  >
                    <option value="transportasi">Transportasi</option>
                    <option value="listrik_air">Listrik & Air</option>
                    <option value="promosi">Promosi</option>
                    <option value="perlengkapan_non_stok">Perlengkapan Non-Stok</option>
                    <option value="biaya_platform">Biaya Platform</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nominal Pengeluaran (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="500"
                  required
                  placeholder="0"
                  value={amountIdr || ''}
                  onChange={(e) => setAmountIdr(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 text-base font-bold rounded-ios border border-border tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-nyeni-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Keterangan / Rincian <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Contoh: Beli bensin motor operasional antar pesanan"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-ios border border-border focus:outline-none focus:ring-2 focus:ring-nyeni-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 rounded-ios border font-bold text-center transition-all ${
                      paymentMethod === 'cash'
                        ? 'border-nyeni-blue bg-nyeni-blue-soft text-nyeni-blue'
                        : 'border-border bg-white text-muted hover:bg-slate-50'
                    }`}
                  >
                    Tunai
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`py-2 rounded-ios border font-bold text-center transition-all ${
                      paymentMethod === 'transfer'
                        ? 'border-nyeni-blue bg-nyeni-blue-soft text-nyeni-blue'
                        : 'border-border bg-white text-muted hover:bg-slate-50'
                    }`}
                  >
                    Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    className={`py-2 rounded-ios border font-bold text-center transition-all ${
                      paymentMethod === 'qris'
                        ? 'border-nyeni-blue bg-nyeni-blue-soft text-nyeni-blue'
                        : 'border-border bg-white text-muted hover:bg-slate-50'
                    }`}
                  >
                    QRIS
                  </button>
                </div>
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
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-ios bg-nyeni-navy text-white font-bold hover:bg-nyeni-navy-hover transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Pengeluaran</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Void Dialog */}
      <ConfirmDialog
        isOpen={!!expenseToVoid}
        title="Batalkan Pengeluaran"
        description={`Anda akan membatalkan pencatatan pengeluaran "${expenseToVoid?.description}" senilai ${formatRupiah(
          expenseToVoid?.amount_idr
        )}.`}
        confirmLabel="Ya, Batalkan Pengeluaran"
        variant="danger"
        requireReason={true}
        reasonPlaceholder="Tuliskan alasan pembatalan biaya ini..."
        isLoading={isVoiding}
        onConfirm={handleConfirmVoid}
        onClose={() => setExpenseToVoid(null)}
      />
    </AppShell>
  );
}
