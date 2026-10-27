'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ReceiptModal } from '@/features/pos/ReceiptModal';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAuth } from '@/context/auth-context';
import { useNotification } from '@/context/notification-context';
import { localDb } from '@/lib/storage/local-db';
import { Sale, BusinessSettings } from '@/types';
import { formatRupiah, formatDateTime } from '@/lib/format';
import {
  Search,
  Receipt,
  Printer,
  Ban,
  Eye,
  AlertTriangle,
  User,
} from 'lucide-react';

export default function TransactionsPage() {
  const { profile, isAdmin } = useAuth();
  const { notify } = useNotification();

  const [sales, setSales] = useState<Sale[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'void'>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  // Modals & Actions
  const [selectedSaleForDetail, setSelectedSaleForDetail] = useState<Sale | null>(null);
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [saleToVoid, setSaleToVoid] = useState<Sale | null>(null);
  const [isVoiding, setIsVoiding] = useState(false);

  const fetchSales = useCallback(() => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const db = localDb.getDb();
      let allSales = [...db.sales].reverse();

      // If cashier, only their own sales
      if (profile && profile.role === 'cashier') {
        allSales = allSales.filter((s) => s.cashier_id === profile.id);
      }

      setSales(allSales);
      setSettings(db.business_settings || null);
    } catch (err: unknown) {
      console.error('Fetch sales error:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuat histori transaksi.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Handle Void (Admin only)
  const handleConfirmVoid = async (reason?: string) => {
    if (!saleToVoid || !reason || !profile) return;
    setIsVoiding(true);

    try {
      localDb.voidSale(saleToVoid.id, profile.id, reason);
      notify({
        type: 'warning',
        title: `Transaksi #${saleToVoid.receipt_number} Telah Dibatalkan (Void)`,
        message: 'Stok bahan baku terkait telah dikembalikan ke inventori secara otomatis.',
      });
      fetchSales();
      setSaleToVoid(null);
      if (selectedSaleForDetail?.id === saleToVoid.id) {
        setSelectedSaleForDetail(null);
      }
    } catch (err: unknown) {
      console.error('Void error:', err);
      alert(err instanceof Error ? err.message : 'Gagal membatalkan transaksi.');
    } finally {
      setIsVoiding(false);
    }
  };

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchSearch =
        s.receipt_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.customer_name &&
          s.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.cashier?.full_name &&
          s.cashier.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.qris_reference && s.qris_reference.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchPayment = paymentFilter === 'all' || s.payment_method === paymentFilter;

      return matchSearch && matchStatus && matchPayment;
    });
  }, [sales, searchQuery, statusFilter, paymentFilter]);

  return (
    <AppShell>
      <PageHeader
        title="Riwayat Transaksi"
        subtitle={
          isAdmin
            ? 'Kelola seluruh transaksi kasir, cetak ulang struk, dan proses pembatalan (void)'
            : 'Daftar transaksi kasir yang Anda buat hari ini'
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-ios-card border border-border shadow-ios mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari No. Struk, nama pembeli, atau kasir..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-ios border border-border bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-nyeni-blue/30 focus:border-nyeni-blue"
            />
          </div>

          <div className="flex gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs font-semibold rounded-ios border border-border bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-nyeni-blue"
            >
              <option value="all">Semua Status</option>
              <option value="completed">Lunas (Completed)</option>
              <option value="void">Batal (Void)</option>
            </select>

            {/* Payment Method Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-ios border border-border bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-nyeni-blue"
            >
              <option value="all">Semua Pembayaran</option>
              <option value="cash">Tunai</option>
              <option value="qris">QRIS</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          <LoadingSkeleton count={6} className="h-16 w-full" />
        </div>
      ) : errorMessage ? (
        <ErrorState message={errorMessage} onRetry={fetchSales} />
      ) : filteredSales.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Tidak Ada Transaksi"
          description="Belum ada riwayat transaksi yang sesuai dengan filter pencarian Anda."
          action={{
            label: 'Reset Filter',
            onClick: () => {
              setSearchQuery('');
              setStatusFilter('all');
              setPaymentFilter('all');
            },
          }}
        />
      ) : (
        <div className="bg-white rounded-ios-card border border-border shadow-ios overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-border text-muted uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">No. Transaksi</th>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Pembeli</th>
                  <th className="px-4 py-3">Kasir</th>
                  <th className="px-4 py-3">Metode</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-foreground">
                      {sale.receipt_number}
                    </td>
                    <td className="px-4 py-3.5 text-muted whitespace-nowrap">
                      {formatDateTime(sale.created_at)}
                    </td>
                    <td className="px-4 py-3.5 text-nyeni-navy font-bold whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-nyeni-blue shrink-0" />
                        <span>{sale.customer_name || 'Pelanggan'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-foreground whitespace-nowrap">
                      {sale.cashier?.full_name || 'Petugas'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="uppercase font-semibold text-nyeni-blue bg-nyeni-blue-soft px-2 py-0.5 rounded text-[11px]">
                        {sale.payment_method}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusBadge
                        label={sale.status === 'completed' ? 'Lunas' : 'Void'}
                        variant={sale.status === 'completed' ? 'success' : 'danger'}
                      />
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-nyeni-navy tabular-nums text-sm whitespace-nowrap">
                      {formatRupiah(sale.total_idr)}
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedSaleForDetail(sale)}
                          title="Lihat Rincian"
                          className="p-1.5 text-slate-500 hover:text-nyeni-blue hover:bg-nyeni-blue-soft rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedSaleForReceipt(sale)}
                          title="Cetak Struk"
                          className="p-1.5 text-slate-500 hover:text-nyeni-navy hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {isAdmin && sale.status === 'completed' && (
                          <button
                            onClick={() => setSaleToVoid(sale)}
                            title="Batalkan (Void)"
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction Detail Drawer / Modal */}
      {selectedSaleForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-ios-card shadow-ios-modal border border-border overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-nyeni-navy">Rincian Transaksi</h3>
                <p className="text-xs text-muted font-mono">{selectedSaleForDetail.receipt_number}</p>
              </div>
              <button
                onClick={() => setSelectedSaleForDetail(null)}
                className="p-1.5 rounded-full text-muted hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              {/* Status Header */}
              <div className="flex justify-between items-center p-3 rounded-ios bg-slate-50 border border-slate-100">
                <div className="space-y-0.5">
                  <span className="text-muted block text-[10px] uppercase font-bold tracking-wider">Nama Pembeli</span>
                  <span className="font-extrabold text-nyeni-navy text-sm flex items-center gap-1.5">
                    <User className="w-4 h-4 text-nyeni-blue shrink-0" />
                    <span>{selectedSaleForDetail.customer_name || 'Pelanggan'}</span>
                  </span>
                  <span className="text-[11px] text-muted block pt-0.5">
                    {formatDateTime(selectedSaleForDetail.created_at)} &bull; {selectedSaleForDetail.cashier?.full_name || 'Kasir'}
                  </span>
                </div>
                <StatusBadge
                  label={selectedSaleForDetail.status === 'completed' ? 'Lunas' : 'Void'}
                  variant={selectedSaleForDetail.status === 'completed' ? 'success' : 'danger'}
                />
              </div>

              {/* Void details if any */}
              {selectedSaleForDetail.status === 'void' && (
                <div className="p-3 rounded-ios bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Dibatalkan (Void)</span>
                  </p>
                  <p className="text-[11px] text-rose-700">
                    Alasan: &quot;{selectedSaleForDetail.void_reason}&quot;
                  </p>
                  <p className="text-[10px] text-rose-600">
                    Waktu void: {formatDateTime(selectedSaleForDetail.void_at)}
                  </p>
                </div>
              )}

              {/* Items List */}
              <div>
                <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                  Item Terjual
                </p>
                <div className="space-y-2 divide-y divide-slate-100">
                  {(selectedSaleForDetail.items || []).map((it) => (
                    <div key={it.id} className="pt-2 first:pt-0">
                      <div className="flex justify-between font-bold text-foreground">
                        <span>
                          {it.quantity}x {it.product_name_snapshot} ({it.variant_name_snapshot})
                        </span>
                        <span className="tabular-nums">{formatRupiah(it.line_total_idr)}</span>
                      </div>
                      {it.addons &&
                        it.addons.map((a) => (
                          <div
                            key={a.id}
                            className="flex justify-between text-[11px] text-amber-700 pl-3 mt-0.5"
                          >
                            <span>+ {a.addon_name_snapshot}</span>
                            <span className="tabular-nums">{formatRupiah(a.line_total_idr)}</span>
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span className="font-bold text-foreground tabular-nums">
                    {formatRupiah(selectedSaleForDetail.subtotal_idr)}
                  </span>
                </div>
                {selectedSaleForDetail.discount_idr > 0 && (
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>Diskon</span>
                    <span className="tabular-nums">
                      -{formatRupiah(selectedSaleForDetail.discount_idr)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-nyeni-navy pt-1 border-t border-slate-200">
                  <span>Total Tagihan</span>
                  <span className="tabular-nums">
                    {formatRupiah(selectedSaleForDetail.total_idr)}
                  </span>
                </div>
                <div className="flex justify-between text-muted pt-1">
                  <span>Metode Bayar</span>
                  <span className="font-bold uppercase text-foreground">
                    {selectedSaleForDetail.payment_method}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-slate-50 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedSaleForReceipt(selectedSaleForDetail);
                  setSelectedSaleForDetail(null);
                }}
                className="flex-1 py-2.5 rounded-ios border border-border bg-white text-foreground hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-nyeni-blue" />
                <span>Cetak Struk</span>
              </button>
              {isAdmin && selectedSaleForDetail.status === 'completed' && (
                <button
                  type="button"
                  onClick={() => {
                    setSaleToVoid(selectedSaleForDetail);
                    setSelectedSaleForDetail(null);
                  }}
                  className="flex-1 py-2.5 rounded-ios bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Void Transaksi</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Void Confirmation Dialog with Mandatory Reason */}
      <ConfirmDialog
        isOpen={!!saleToVoid}
        title="Konfirmasi Pembatalan (Void)"
        description={`Anda akan membatalkan transaksi #${saleToVoid?.receipt_number} senilai ${formatRupiah(
          saleToVoid?.total_idr
        )}. Tindakan ini akan mengembalikan stok bahan baku secara otomatis.`}
        confirmLabel="Ya, Batalkan Transaksi"
        variant="danger"
        requireReason={true}
        reasonPlaceholder="Contoh: Kesalahan input menu / Pembeli membatalkan pesanan..."
        isLoading={isVoiding}
        onConfirm={handleConfirmVoid}
        onClose={() => setSaleToVoid(null)}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        sale={selectedSaleForReceipt}
        settings={settings}
        onClose={() => setSelectedSaleForReceipt(null)}
      />
    </AppShell>
  );
}
