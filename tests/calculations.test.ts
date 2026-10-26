import { describe, it, expect } from 'vitest';
import {
  calculateWeightedAverageCost,
  calculateCartTotals,
  calculateChangeDue,
  calculateFinancialMetrics,
} from '../src/lib/calculations';
import { CartItem } from '../src/types';

describe('Financial & POS Calculations', () => {
  describe('calculateWeightedAverageCost', () => {
    it('calculates weighted average cost correctly for incoming stock', () => {
      // 10kg at Rp30.000/kg (30/g) + 10kg at Rp40.000/kg (40/g) = 20kg at Rp35.000/kg (35/g)
      const avg = calculateWeightedAverageCost(10000, 30, 10000, 40);
      expect(avg).toBe(35);
    });

    it('handles zero initial stock correctly', () => {
      const avg = calculateWeightedAverageCost(0, 0, 5000, 25);
      expect(avg).toBe(25);
    });

    it('weights accurately when incoming quantity is unequal', () => {
      // 1000g at Rp10 + 3000g at Rp20 = (10000 + 60000) / 4000 = 70000 / 4000 = 17.5
      const avg = calculateWeightedAverageCost(1000, 10, 3000, 20);
      expect(avg).toBe(17.5);
    });
  });

  describe('calculateCartTotals', () => {
    it('computes subtotal with variants and addons', () => {
      const items: CartItem[] = [
        {
          id: 'item-1',
          product_id: 'p1',
          product_name: 'Mango Sago',
          variant_id: 'v1',
          variant_name: '300 ml',
          unit_price_idr: 17000,
          quantity: 2,
          addons: [
            {
              addon_id: 'a1',
              addon_name: 'Mix Fruit',
              unit_price_idr: 2000,
              quantity: 1,
            },
          ],
          has_recipe: true,
        },
      ];

      // (17.000 + 2.000) * 2 = 38.000
      const totals = calculateCartTotals(items, 0);
      expect(totals.subtotal).toBe(38000);
      expect(totals.total).toBe(38000);
      expect(totals.totalCups).toBe(2);
    });

    it('safely caps discounts so total cannot be negative', () => {
      const items: CartItem[] = [
        {
          id: 'item-1',
          product_id: 'p1',
          product_name: 'Dragon Sago',
          variant_id: 'v1',
          variant_name: '200 ml',
          unit_price_idr: 13000,
          quantity: 1,
          addons: [],
          has_recipe: true,
        },
      ];

      const totals = calculateCartTotals(items, 50000);
      expect(totals.subtotal).toBe(13000);
      expect(totals.discount).toBe(13000); // capped
      expect(totals.total).toBe(0);
    });
  });

  describe('calculateChangeDue', () => {
    it('calculates change due accurately', () => {
      expect(calculateChangeDue(17000, 20000)).toBe(3000);
      expect(calculateChangeDue(22000, 50000)).toBe(28000);
      expect(calculateChangeDue(13000, 13000)).toBe(0);
    });

    it('rejects underpayment by returning -1', () => {
      expect(calculateChangeDue(20000, 15000)).toBe(-1);
    });
  });

  describe('calculateFinancialMetrics', () => {
    it('strictly separates Operating Profit from Cash Flow', () => {
      const testData = {
        sales: [
          {
            status: 'completed' as const,
            subtotal_idr: 50000,
            discount_idr: 5000,
            total_idr: 45000,
            total_cogs_idr: 15000, // HPP based on consumed recipe ingredients
            payment_method: 'cash',
            items: [{ quantity: 3 }],
          },
        ],
        expenses: [
          {
            status: 'active' as const,
            amount_idr: 10000, // operational expense (electricity/transport)
          },
        ],
        stockPurchases: [
          {
            total_cost_idr: 20000, // bulk inventory purchase
            payment_status: 'paid' as const,
          },
        ],
      };

      const metrics = calculateFinancialMetrics(testData);

      // Omzet
      expect(metrics.grossSales).toBe(50000);
      expect(metrics.totalDiscounts).toBe(5000);
      expect(metrics.netSales).toBe(45000);

      // Profit calculations:
      // Gross Profit = Net Sales (45.000) - COGS (15.000) = 30.000
      expect(metrics.estimatedGrossProfit).toBe(30000);
      // Operating Profit = Net Sales (45.000) - COGS (15.000) - Expenses (10.000) = 20.000
      // Notice: Stock purchase (20.000) is NOT subtracted here! That prevents double counting!
      expect(metrics.estimatedOperatingProfit).toBe(20000);

      // Cash Flow calculations:
      // Cash Inflow = 45.000
      // Cash Outflow = Paid Stock Purchases (20.000) + Operating Expenses (10.000) = 30.000
      // Net Cash Flow = 45.000 - 30.000 = 15.000
      expect(metrics.cashInflow).toBe(45000);
      expect(metrics.paidStockPurchases).toBe(20000);
      expect(metrics.operationalExpensesPaid).toBe(10000);
      expect(metrics.netCashFlow).toBe(15000);
    });

    it('ignores voided sales and voided expenses', () => {
      const testData = {
        sales: [
          {
            status: 'void' as const,
            subtotal_idr: 100000,
            discount_idr: 0,
            total_idr: 100000,
            total_cogs_idr: 40000,
            payment_method: 'cash',
          },
        ],
        expenses: [
          {
            status: 'void' as const,
            amount_idr: 50000,
          },
        ],
        stockPurchases: [],
      };

      const metrics = calculateFinancialMetrics(testData);
      expect(metrics.netSales).toBe(0);
      expect(metrics.totalTransactions).toBe(0);
      expect(metrics.estimatedCOGS).toBe(0);
      expect(metrics.operationalExpenses).toBe(0);
    });
  });
});
