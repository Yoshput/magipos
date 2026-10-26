'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { MoneyText } from '@/components/ui/MoneyText';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAuth } from '@/context/auth-context';
import { localDb } from '@/lib/storage/local-db';
import { calculateFinancialMetrics } from '@/lib/calculations';
import { formatRupiah, formatNumber, formatDateTime } from '@/lib/format';
import {
  TrendingUp,
  Receipt,
  Coffee,
  Coins,
  AlertTriangle,
  ArrowRight,
  Store,
  Lock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function DashboardPage() {
  const { isAdmin } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [metrics, setMetrics] = useState({
    grossSales: 0,
    netSales: 0,
    totalTransactions: 0,
    totalCupsSold: 0,
    estimatedCOGS: 0,
    estimatedGrossProfit: 0,
    operationalExpenses: 0,
    estimatedOperatingProfit: 0,
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [lowStockIngredients, setLowStockIngredients] = useState<any[]>([]);
  const [paymentData, setPaymentData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchDashboardData = useCallback(() => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const db = localDb.getDb();

      // Today's date filter
      const today = new Date().toISOString().split('T')[0];

      // 1. Sales today
      const salesToday = db.sales.filter((s) => s.created_at.startsWith(today));

      // 2. Expenses today
      const expensesToday = db.expenses.filter((e) => e.expense_date === today);

      // 3. Stock purchases today
      const purchasesToday = db.stock_purchases.filter((p) => p.purchase_date === today);

      // 4. Calculate Financial Metrics
      const calculated = calculateFinancialMetrics({
        sales: salesToday as any,
        expenses: expensesToday as any,
        stockPurchases: purchasesToday as any,
      });

      setMetrics(calculated);
      setRecentSales(db.sales.slice(-5).reverse());

      // 5. Payment Breakdown chart
      const payments = [
        { name: 'Tunai', value: calculated.paymentBreakdown.cash.total, color: '#142A72' },
        { name: 'QRIS', value: calculated.paymentBreakdown.qris.total, color: '#1769E8' },
        { name: 'Transfer', value: calculated.paymentBreakdown.transfer.total, color: '#FFC928' },
      ].filter((p) => p.value > 0);
      setPaymentData(payments);

      // 6. Hourly distribution
      const hourlySummary: Record<string, number> = {
        '10:00': 0,
        '12:00': 0,
        '14:00': 0,
        '16:00': 0,
        '18:00': 0,
        '20:00': 0,
      };

      salesToday.forEach((s) => {
        if (s.status === 'completed') {
          const hour = new Date(s.created_at).getHours();
          if (hour < 12) hourlySummary['10:00'] += s.total_idr;
          else if (hour < 14) hourlySummary['12:00'] += s.total_idr;
          else if (hour < 16) hourlySummary['14:00'] += s.total_idr;
          else if (hour < 18) hourlySummary['16:00'] += s.total_idr;
          else if (hour < 20) hourlySummary['18:00'] += s.total_idr;
          else hourlySummary['20:00'] += s.total_idr;
        }
      });

      setChartData(
        Object.entries(hourlySummary).map(([time, total]) => ({
          time,
          omzet: total,
        }))
      );

      // 7. Low stock ingredients
      const low = db.ingredients.filter(
        (ing) => Number(ing.stock_base) <= Number(ing.minimum_stock_base)
      );
      setLowStockIngredients(low);
    } catch (err: unknown) {
      console.error('Dashboard error:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuat data ringkasan.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <AppShell>
      <PageHeader
        title="Ringkasan Hari Ini"
        subtitle="Pantau omzet penjualan, transaksi kasir, dan ketersediaan stok bahan secara real-time"
        action={
          <Link
            href="/pos"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-ios bg-nyeni-blue text-white font-bold text-xs sm:text-sm hover:bg-nyeni-blue-hover transition-colors shadow-sm"
          >
            <Store className="w-4 h-4" />
            <span>Buka Kasir (POS)</span>
          </Link>
        }
      />

      {errorMessage && (
        <div className="mb-6">
          <ErrorState message={errorMessage} onRetry={fetchDashboardData} />
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-6">
        {/* Omzet Bersih */}
        <div className="bg-white p-4 sm:p-5 rounded-ios-card border border-border shadow-ios flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              Omzet Bersih
            </span>
            <div className="w-8 h-8 rounded-lg bg-nyeni-blue-soft text-nyeni-blue flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            {isLoading ? (
              <LoadingSkeleton className="h-8 w-28" />
            ) : (
              <MoneyText amount={metrics.netSales} size="xl" className="text-nyeni-navy" />
            )}
            <p className="text-[11px] text-muted mt-1">
              Omzet kotor: {formatRupiah(metrics.grossSales)}
            </p>
          </div>
        </div>

        {/* Transaksi Selesai */}
        <div className="bg-white p-4 sm:p-5 rounded-ios-card border border-border shadow-ios flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              Transaksi
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            {isLoading ? (
              <LoadingSkeleton className="h-8 w-20" />
            ) : (
              <span className="text-xl sm:text-2xl font-black text-foreground tabular-nums">
                {formatNumber(metrics.totalTransactions)}
              </span>
            )}
            <p className="text-[11px] text-muted mt-1">Struk tercatat hari ini</p>
          </div>
        </div>

        {/* Total Cup Terjual */}
        <div className="bg-white p-4 sm:p-5 rounded-ios-card border border-border shadow-ios flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              Cup Terjual
            </span>
            <div className="w-8 h-8 rounded-lg bg-nyeni-mango-soft text-amber-700 flex items-center justify-center">
              <Coffee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            {isLoading ? (
              <LoadingSkeleton className="h-8 w-20" />
            ) : (
              <span className="text-xl sm:text-2xl font-black text-foreground tabular-nums">
                {formatNumber(metrics.totalCupsSold)} cup
              </span>
            )}
            <p className="text-[11px] text-muted mt-1">Dessert terdistribusi</p>
          </div>
        </div>

        {/* Estimasi Laba Operasional (Admin Only) */}
        <div className="bg-white p-4 sm:p-5 rounded-ios-card border border-border shadow-ios flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              {isAdmin ? 'Laba Bersih Est.' : 'Akses Terbatas'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              {isAdmin ? <Coins className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-2">
            {isLoading ? (
              <LoadingSkeleton className="h-8 w-28" />
            ) : isAdmin ? (
              <MoneyText
                amount={metrics.estimatedOperatingProfit}
                size="xl"
                className="text-emerald-700"
              />
            ) : (
              <span className="text-xs text-muted italic">
                Hanya dapat diakses akun Admin
              </span>
            )}
            <p className="text-[11px] text-muted mt-1">
              {isAdmin ? 'Setelah HPP & pengeluaran' : 'Kebijakan privasi keuangan'}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Sales Trend Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-ios-card border border-border shadow-ios">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-nyeni-navy">Tren Penjualan Hari Ini</h3>
              <p className="text-xs text-muted">Akumulasi omzet berdasarkan rentang jam operasional</p>
            </div>
            <span className="text-xs font-semibold text-nyeni-blue bg-nyeni-blue-soft px-2.5 py-1 rounded-full">
              WIB (Jakarta)
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOmzet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1769E8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1769E8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E9F2" />
                <XAxis dataKey="time" stroke="#667085" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#667085"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `Rp${val / 1000}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatRupiah(Number(val)), 'Omzet']}
                  contentStyle={{
                    borderRadius: '12px',
                    backgroundColor: '#142A72',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                  itemStyle={{ color: '#FFC928' }}
                />
                <Area
                  type="monotone"
                  dataKey="omzet"
                  stroke="#1769E8"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorOmzet)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Method Breakdown (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-ios-card border border-border shadow-ios flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-nyeni-navy mb-1">Metode Pembayaran</h3>
            <p className="text-xs text-muted mb-4">Distribusi transaksi Tunai, QRIS, & Transfer</p>

            {paymentData.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs text-muted italic">
                Belum ada transaksi hari ini
              </div>
            ) : (
              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                    >
                      {paymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => formatRupiah(Number(val))}
                      contentStyle={{
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {paymentData.map((p) => (
              <div key={p.name} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="font-semibold text-foreground">{p.name}</span>
                </div>
                <span className="font-bold tabular-nums text-foreground">
                  {formatRupiah(p.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Columns: Recent Transactions & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Transactions (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-ios-card border border-border shadow-ios">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-nyeni-navy">Aktivitas Transaksi Terakhir</h3>
            <Link
              href="/transactions"
              className="text-xs font-bold text-nyeni-blue hover:text-nyeni-blue-hover flex items-center gap-1"
            >
              <span>Semua Transaksi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentSales.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted">
              Belum ada transaksi yang tercatat hari ini.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentSales.map((sale) => (
                <div key={sale.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {sale.receipt_number}
                      </span>
                      <StatusBadge
                        label={sale.status === 'completed' ? 'Lunas' : 'Void'}
                        variant={sale.status === 'completed' ? 'success' : 'danger'}
                      />
                    </div>
                    <p className="text-[11px] text-muted mt-0.5">
                      {formatDateTime(sale.created_at)} •{' '}
                      <span className="uppercase font-semibold">{sale.payment_method}</span>
                    </p>
                  </div>

                  <span className="text-sm font-black text-nyeni-navy tabular-nums">
                    {formatRupiah(sale.total_idr)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Warning (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-ios-card border border-border shadow-ios">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-base font-bold text-nyeni-navy">Peringatan Stok Menipis</h3>
            </div>
            <Link
              href="/inventory"
              className="text-xs font-bold text-nyeni-blue hover:text-nyeni-blue-hover flex items-center gap-1"
            >
              <span>Inventori</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {lowStockIngredients.length === 0 ? (
            <div className="text-center py-8 text-xs text-emerald-700 bg-emerald-50/50 rounded-ios border border-emerald-100">
              Semua stok bahan baku saat ini berada di atas batas minimum.
            </div>
          ) : (
            <div className="space-y-2.5">
              {lowStockIngredients.map((ing) => (
                <div
                  key={ing.id}
                  className="p-3 rounded-ios border border-amber-200 bg-amber-50/50 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{ing.name}</h4>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Min. Stok: {formatNumber(ing.minimum_stock_base)} {ing.base_unit}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-rose-600 block tabular-nums">
                      {formatNumber(ing.stock_base)} {ing.base_unit}
                    </span>
                    <span className="text-[10px] font-bold text-rose-700 uppercase">
                      {Number(ing.stock_base) <= 0 ? 'Habis' : 'Menipis'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
