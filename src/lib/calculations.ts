import { CartItem } from '@/types';

/**
 * Weighted Average Cost (Biaya Rata-Rata Tertimbang)
 * Formula: (stok_lama × biaya_rata_lama + qty_masuk_dasar × biaya_masuk_per_dasar) / (stok_lama + qty_masuk_dasar)
 */
export function calculateWeightedAverageCost(
  currentStock: number,
  currentAverageCost: number,
  incomingStock: number,
  incomingUnitCost: number
): number {
  const totalStock = currentStock + incomingStock;
  if (totalStock <= 0) {
    return incomingUnitCost > 0 ? incomingUnitCost : 0;
  }
  const totalCost = currentStock * currentAverageCost + incomingStock * incomingUnitCost;
  return Math.round((totalCost / totalStock) * 10000) / 10000;
}

/**
 * Calculate Cart Totals
 */
export function calculateCartTotals(items: CartItem[], discountIdr: number = 0) {
  let subtotal = 0;
  let totalCups = 0;

  for (const item of items) {
    const addonsTotal = item.addons.reduce((acc, a) => acc + a.unit_price_idr * a.quantity, 0);
    const itemTotal = (item.unit_price_idr + addonsTotal) * item.quantity;
    subtotal += itemTotal;
    totalCups += item.quantity;
  }

  const safeDiscount = Math.max(0, Math.min(discountIdr, subtotal));
  const total = Math.max(0, subtotal - safeDiscount);

  return {
    subtotal,
    discount: safeDiscount,
    total,
    totalCups,
  };
}

/**
 * Calculate Cash Change Due
 * Returns -1 if cash received is less than total
 */
export function calculateChangeDue(totalIdr: number, cashReceivedIdr: number): number {
  if (cashReceivedIdr < totalIdr) {
    return -1;
  }
  return cashReceivedIdr - totalIdr;
}

export interface FinancialSummaryInput {
  sales: Array<{
    status: 'completed' | 'void';
    subtotal_idr: number;
    discount_idr: number;
    total_idr: number;
    total_cogs_idr: number;
    payment_method: string;
    items?: Array<{ quantity: number }>;
  }>;
  expenses: Array<{
    status: 'active' | 'void';
    amount_idr: number;
  }>;
  stockPurchases: Array<{
    total_cost_idr: number;
    payment_status: 'paid' | 'pending';
  }>;
}

/**
 * Calculate complete Financial Metrics according to PRD section 7:
 * - Gross Sales (Omzet Kotor)
 * - Net Sales (Omzet Bersih)
 * - Estimated COGS (HPP Estimasi)
 * - Estimated Gross Profit (Laba Kotor Estimasi)
 * - Operational Expenses (Pengeluaran Operasional)
 * - Estimated Operational Profit (Laba Operasional Estimasi = Omzet Bersih - HPP - Biaya Operasional)
 * - Cash Flow (Arus Kas Bersih = Kas Masuk Penjualan - Kas Keluar Pembelian Stok - Kas Keluar Pengeluaran)
 */
export function calculateFinancialMetrics(data: FinancialSummaryInput) {
  // Only completed sales count
  const validSales = data.sales.filter((s) => s.status === 'completed');

  let grossSales = 0;
  let totalDiscounts = 0;
  let netSales = 0;
  let estimatedCOGS = 0;
  let totalTransactions = validSales.length;
  let totalCupsSold = 0;

  const paymentBreakdown: Record<string, { count: number; total: number }> = {
    cash: { count: 0, total: 0 },
    qris: { count: 0, total: 0 },
    transfer: { count: 0, total: 0 },
  };

  for (const s of validSales) {
    grossSales += s.subtotal_idr;
    totalDiscounts += s.discount_idr;
    netSales += s.total_idr;
    estimatedCOGS += s.total_cogs_idr || 0;

    if (paymentBreakdown[s.payment_method]) {
      paymentBreakdown[s.payment_method].count += 1;
      paymentBreakdown[s.payment_method].total += s.total_idr;
    }

    if (s.items && Array.isArray(s.items)) {
      for (const it of s.items) {
        totalCupsSold += it.quantity;
      }
    }
  }

  // Active operational expenses
  const validExpenses = data.expenses.filter((e) => e.status === 'active');
  const operationalExpenses = validExpenses.reduce((acc, e) => acc + e.amount_idr, 0);

  // Profit calculations
  const estimatedGrossProfit = netSales - estimatedCOGS;
  const estimatedOperatingProfit = netSales - estimatedCOGS - operationalExpenses;

  // Cash Flow calculations (Stock purchases paid + operational expenses paid vs sales received)
  const paidStockPurchases = data.stockPurchases
    .filter((p) => p.payment_status === 'paid')
    .reduce((acc, p) => acc + p.total_cost_idr, 0);

  const cashInflow = netSales;
  const cashOutflow = paidStockPurchases + operationalExpenses;
  const netCashFlow = cashInflow - cashOutflow;

  return {
    grossSales,
    totalDiscounts,
    netSales,
    totalTransactions,
    totalCupsSold,
    estimatedCOGS,
    estimatedGrossProfit,
    operationalExpenses,
    estimatedOperatingProfit,
    paymentBreakdown,
    // Cash flow metrics
    cashInflow,
    paidStockPurchases,
    operationalExpensesPaid: operationalExpenses,
    cashOutflow,
    netCashFlow,
  };
}
