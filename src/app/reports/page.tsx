'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { MoneyText } from '@/components/ui/MoneyText';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAuth } from '@/context/auth-context';
import { localDb } from '@/lib/storage/local-db';
import { calculateFinancialMetrics } from '@/lib/calculations';
import { generateCsv, downloadCsv } from '@/lib/csv';
import { exportToExcel, exportToPdf } from '@/lib/export-reports';
import { useNotification } from '@/context/notification-context';
import { formatRupiah, formatNumber } from '@/lib/format';
import {
  Download,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';

type DatePreset = 'today' | 'yesterday' | 'last7' | 'this_month' | 'last_month' | 'custom';

export default function ReportsPage() {
  const { isAdmin } = useAuth();
  const { notify } = useNotification();

  const [preset, setPreset] = useState<DatePreset>('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Data
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [ingredientsUsage, setIngredientsUsage] = useState<any[]>([]);

  // Calculate Date Bounds
  useEffect(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');

    if (preset === 'today') {
      const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const yestStr = `${yest.getFullYear()}-${pad(yest.getMonth() + 1)}-${pad(yest.getDate())}`;
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (preset === 'last7') {
      const past7 = new Date(now);
      past7.setDate(past7.getDate() - 6);
      setStartDate(`${past7.getFullYear()}-${pad(past7.getMonth() + 1)}-${pad(past7.getDate())}`);
      setEndDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
    } else if (preset === 'this_month') {
      setStartDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      setEndDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(lastDay)}`);
    } else if (preset === 'last_month') {
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayPrev = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      setStartDate(`${prevMonth.getFullYear()}-${pad(prevMonth.getMonth() + 1)}-01`);
      setEndDate(`${prevMonth.getFullYear()}-${pad(prevMonth.getMonth() + 1)}-${pad(lastDayPrev)}`);
    }
  }, [preset]);

  const fetchReportsData = useCallback(() => {
    if (!startDate || !endDate) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const db = localDb.getDb();

      // Filter sales in range
      const salesInRange = db.sales.filter((s) => {
        const dateOnly = s.created_at.split('T')[0];
        return dateOnly >= startDate && dateOnly <= endDate;
      });

      // Filter expenses in range
      const expensesInRange = db.expenses.filter((e) => {
        return e.expense_date >= startDate && e.expense_date <= endDate;
      });

      // Filter purchases in range
      const purchasesInRange = db.stock_purchases.filter((p) => {
        return p.purchase_date >= startDate && p.purchase_date <= endDate;
      });

      setSales(salesInRange);
      setExpenses(expensesInRange);
      setPurchases(purchasesInRange);

      // Aggregate ingredient usage from movements
      const movementsInRange = db.inventory_movements.filter((m) => {
        const dateOnly = m.created_at.split('T')[0];
        return m.movement_type === 'sale' && dateOnly >= startDate && dateOnly <= endDate;
      });

      const usageMap: Record<string, { name: string; unit: string; qty: number }> = {};
      movementsInRange.forEach((m: any) => {
        const ing = db.ingredients.find((i) => i.id === m.ingredient_id);
        const ingName = ing?.name || m.ingredient?.name || 'Bahan';
        const ingUnit = ing?.base_unit || m.ingredient?.base_unit || '';

        if (!usageMap[m.ingredient_id]) {
          usageMap[m.ingredient_id] = {
            name: ingName,
            unit: ingUnit,
            qty: 0,
          };
        }
        usageMap[m.ingredient_id].qty += Math.abs(Number(m.quantity_delta_base));
      });

      setIngredientsUsage(Object.values(usageMap));
    } catch (err: unknown) {
      console.error('Reports fetch error:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuat laporan keuangan.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  // Financial calculations
  const metrics = useMemo(() => {
    return calculateFinancialMetrics({
      sales,
      expenses,
      stockPurchases: purchases,
    });
  }, [sales, expenses, purchases]);

  // Top products calculation
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; cups: number; total: number }> = {};
    sales
      .filter((s) => s.status === 'completed')
      .forEach((s) => {
        (s.items || []).forEach((item: any) => {
          const key = `${item.product_name_snapshot} (${item.variant_name_snapshot})`;
          if (!map[key]) {
            map[key] = { name: key, cups: 0, total: 0 };
          }
          map[key].cups += item.quantity;
          map[key].total += item.line_total_idr;
        });
      });

    return Object.values(map).sort((a, b) => b.cups - a.cups);
  }, [sales]);

  // Export Excel Handler
  const handleExportExcel = () => {
    try {
      exportToExcel({
        periodLabel: preset === 'this_month' ? 'Bulan Ini' : preset === 'last7' ? '7 Hari Terakhir' : `${startDate} s/d ${endDate}`,
        startDate,
        endDate,
        metrics,
        sales,
        expenses,
        purchases,
        ingredientsUsage,
        topProducts,
      });
      notify({
        type: 'success',
        title: 'Ekspor Excel Berhasil',
        message: 'File spreadsheet laporan keuangan (.xlsx) berhasil diunduh.',
      });
    } catch (err) {
      notify({
        type: 'error',
        title: 'Gagal Ekspor Excel',
        message: err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses Excel.',
      });
    }
  };

  // Export PDF Handler
  const handleExportPdf = () => {
    try {
      exportToPdf({
        periodLabel: preset === 'this_month' ? 'Bulan Ini' : preset === 'last7' ? '7 Hari Terakhir' : `${startDate} s/d ${endDate}`,
        startDate,
        endDate,
        metrics,
        sales,
        expenses,
        purchases,
        ingredientsUsage,
        topProducts,
      });
      notify({
        type: 'success',
        title: 'Ekspor PDF Berhasil',
        message: 'Dokumen laporan keuangan resmi (.pdf) berhasil diunduh.',
      });
    } catch (err) {
      notify({
        type: 'error',
        title: 'Gagal Ekspor PDF',
        message: err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses PDF.',
      });
    }
  };

  // Export CSV Handler
  const handleExportCsv = () => {
    const headers = [
      'No. Transaksi',
      'Tanggal & Waktu (WIB)',
      'Status',
      'Metode Pembayaran',
      'Subtotal (Rp)',
      'Diskon (Rp)',
      'Total Omzet (Rp)',
      'HPP Estimasi (Rp)',
      'Laba Kotor Est. (Rp)',
    ];

    const rows = sales.map((s) => [
      s.receipt_number,
      s.created_at,
      s.status,
      s.payment_method,
      s.subtotal_idr,
      s.discount_idr,
      s.total_idr,
      s.total_cogs_idr || 0,
      s.total_idr - (s.total_cogs_idr || 0),
    ]);

    const csvContent = generateCsv(headers, rows);
    const filename = `Laporan_Penjualan_Mango_Nyeni_${startDate}_sd_${endDate}.csv`;
    downloadCsv(filename, csvContent);
    notify({
      type: 'info',
      title: 'Ekspor CSV Berhasil',
      message: 'File data mentah CSV berhasil diunduh.',
    });
  };

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="p-8 text-center bg-white rounded-ios-card border border-border shadow-ios max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-foreground">Akses Terbatas</h2>
          <p className="text-xs text-muted mt-1">
            Laporan keuangan, HPP, laba estimasi, dan arus kas hanya dapat diakses oleh akun Admin.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Laporan & Analitik Keuangan"
        subtitle="Analisis omzet bersih, HPP estimasi, laba operasional, dan pemisahan arus kas riil"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={sales.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-ios border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs transition-colors shadow-xs disabled:opacity-50"
              title="Ekspor seluruh data laporan ke file Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={sales.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-ios border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 font-bold text-xs transition-colors shadow-xs disabled:opacity-50"
              title="Ekspor laporan resmi berformat PDF A4"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>Ekspor PDF (.pdf)</span>
            </button>

            <button
              onClick={handleExportCsv}
              disabled={sales.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-ios border border-border bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors shadow-xs disabled:opacity-50"
              title="Ekspor data transaksi mentah ke CSV RFC 4180"
            >
              <Download className="w-3.5 h-3.5 text-nyeni-blue" />
              <span>CSV</span>
            </button>
          </div>
        }
      />

      {/* Date Filter Toolbar */}
      <div className="bg-white p-4 rounded-ios-card border border-border shadow-ios mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: 'yesterday', label: 'Kemarin' },
            { id: 'last7', label: '7 Hari' },
            { id: 'this_month', label: 'Bulan Ini' },
            { id: 'last_month', label: 'Bulan Lalu' },
            { id: 'custom', label: 'Kustom' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPreset(item.id as DatePreset)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                preset === item.id
                  ? 'bg-nyeni-navy text-white shadow-xs'
                  : 'bg-slate-100 text-muted hover:text-foreground'
              }`}
            >
              {item.label}
            </button>
          ))}

          {/* Date Range Inputs */}
          <div className="flex items-center gap-2 ml-auto text-xs font-semibold text-muted">
            <Calendar className="w-4 h-4 text-nyeni-blue" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPreset('custom');
              }}
              className="px-2 py-1 rounded-lg border border-border bg-slate-50 text-foreground"
            />
            <span>s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPreset('custom');
              }}
              className="px-2 py-1 rounded-lg border border-border bg-slate-50 text-foreground"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={4} className="h-28 w-full mb-6" />
      ) : errorMessage ? (
        <ErrorState message={errorMessage} onRetry={fetchReportsData} />
      ) : (
        <>
          {/* Main Financial KPI Grid (Laba Rugi Estimasi) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-6">
            {/* Omzet Bersih */}
            <div className="bg-white p-5 rounded-ios-card border border-border shadow-ios">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                Omzet Bersih
              </span>
              <MoneyText amount={metrics.netSales} size="xl" className="text-nyeni-navy mt-1" />
              <p className="text-[11px] text-muted mt-1">
                Kotor: {formatRupiah(metrics.grossSales)} (Diskon {formatRupiah(metrics.totalDiscounts)})
              </p>
            </div>

            {/* HPP Estimasi */}
            <div className="bg-white p-5 rounded-ios-card border border-border shadow-ios">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                HPP Estimasi (COGS)
              </span>
              <MoneyText amount={metrics.estimatedCOGS} size="xl" className="text-amber-700 mt-1" />
              <p className="text-[11px] text-muted mt-1">
                Biaya bahan baku terpakai
              </p>
            </div>

            {/* Biaya Operasional */}
            <div className="bg-white p-5 rounded-ios-card border border-border shadow-ios">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                Biaya Operasional
              </span>
              <MoneyText amount={metrics.operationalExpenses} size="xl" className="text-rose-600 mt-1" />
              <p className="text-[11px] text-muted mt-1">
                Listrik, transportasi, dll.
              </p>
            </div>

            {/* Laba Operasional Estimasi */}
            <div className="bg-white p-5 rounded-ios-card border border-border shadow-ios">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                Laba Operasional Est.
              </span>
              <MoneyText
                amount={metrics.estimatedOperatingProfit}
                size="xl"
                className="text-emerald-700 mt-1"
              />
              <p className="text-[11px] text-muted mt-1">
                Margin: {metrics.netSales > 0 ? Math.round((metrics.estimatedOperatingProfit / metrics.netSales) * 100) : 0}%
              </p>
            </div>
          </div>

          {/* Separate Cash Flow Card (PRD line 62 & 128: Pisahkan laba dari arus kas) */}
          <div className="bg-white p-5 sm:p-6 rounded-ios-card border border-border shadow-ios mb-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-black text-nyeni-navy">
                  Laporan Arus Kas Riil (Cash Flow)
                </h3>
                <p className="text-xs text-muted">
                  Uang tunai/transfer riil masuk dan keluar selama periode ini
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                Terpisah dari HPP
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-ios bg-emerald-50/60 border border-emerald-100">
                <span className="text-emerald-800 font-bold block mb-1">
                  (+) Kas Masuk Penjualan
                </span>
                <span className="text-base font-black text-emerald-900 tabular-nums">
                  {formatRupiah(metrics.cashInflow)}
                </span>
                <p className="text-[10px] text-emerald-700 mt-1">Total penerimaan kasir</p>
              </div>

              <div className="p-3.5 rounded-ios bg-rose-50/60 border border-rose-100">
                <span className="text-rose-800 font-bold block mb-1">
                  (-) Pembelian Stok Dibayar
                </span>
                <span className="text-base font-black text-rose-900 tabular-nums">
                  {formatRupiah(metrics.paidStockPurchases)}
                </span>
                <p className="text-[10px] text-rose-700 mt-1">Restock bahan baku lunas</p>
              </div>

              <div className="p-3.5 rounded-ios bg-rose-50/60 border border-rose-100">
                <span className="text-rose-800 font-bold block mb-1">
                  (-) Pengeluaran Operasional
                </span>
                <span className="text-base font-black text-rose-900 tabular-nums">
                  {formatRupiah(metrics.operationalExpensesPaid)}
                </span>
                <p className="text-[10px] text-rose-700 mt-1">Biaya harian toko</p>
              </div>

              <div className="p-3.5 rounded-ios bg-nyeni-blue-soft/60 border border-nyeni-blue/20">
                <span className="text-nyeni-blue font-bold block mb-1">
                  (=) Arus Kas Bersih
                </span>
                <span className="text-base font-black text-nyeni-navy tabular-nums">
                  {formatRupiah(metrics.netCashFlow)}
                </span>
                <p className="text-[10px] text-muted mt-1">Sisa kas periode ini</p>
              </div>
            </div>
          </div>

          {/* Two Columns: Top Products & Ingredients Consumption */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Top Products (6 cols) */}
            <div className="lg:col-span-6 bg-white p-5 rounded-ios-card border border-border shadow-ios">
              <h3 className="text-base font-bold text-nyeni-navy mb-1">Produk & Ukuran Terlaris</h3>
              <p className="text-xs text-muted mb-4">Peringkat menu berdasarkan total cup terjual</p>

              {topProducts.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted">
                  Belum ada data penjualan pada rentang tanggal ini.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs font-medium">
                  {topProducts.map((p, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-center font-bold text-muted">{idx + 1}</span>
                        <span className="font-bold text-foreground">{p.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-nyeni-blue tabular-nums block">
                          {formatNumber(p.cups)} cup
                        </span>
                        <span className="text-[11px] text-muted tabular-nums">
                          {formatRupiah(p.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ingredients Usage (6 cols) */}
            <div className="lg:col-span-6 bg-white p-5 rounded-ios-card border border-border shadow-ios">
              <h3 className="text-base font-bold text-nyeni-navy mb-1">Bahan Baku Terpakai</h3>
              <p className="text-xs text-muted mb-4">Total konsumsi bahan berdasarkan resep yang terjual</p>

              {ingredientsUsage.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted">
                  Belum ada konsumsi bahan baku pada rentang tanggal ini.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs font-medium">
                  {ingredientsUsage.map((ing, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between">
                      <span className="font-bold text-foreground">{ing.name}</span>
                      <span className="font-black text-nyeni-navy tabular-nums">
                        {formatNumber(ing.qty)} {ing.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
