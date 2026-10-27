import { describe, it, expect, beforeEach } from 'vitest';
import { localDb } from '../src/lib/storage/local-db';
import { calculateCartTotals, calculateChangeDue, calculateFinancialMetrics } from '../src/lib/calculations';
import { CartItem } from '../src/types';

describe('Acceptance Criteria A through H (MAGIPOS Audit)', () => {
  beforeEach(() => {
    // Reset database to known seed state before each test
    localDb.resetToDefault();
  });

  // -------------------------------------------------------------
  // Skenario A: Alur Kasir Dasar & Transaksi Cash
  // -------------------------------------------------------------
  describe('Skenario A: Alur Kasir Dasar & Transaksi Cash', () => {
    it('menghitung keranjang Mango Sago 200ml sebesar Rp13.000 tanpa add-on', () => {
      const items: CartItem[] = [
        {
          id: 'var_ms_200__',
          product_id: 'prod_mango_sago',
          product_name: 'Mango Sago',
          variant_id: 'var_ms_200',
          variant_name: '200 ml',
          unit_price_idr: 13000,
          quantity: 1,
          addons: [],
          has_recipe: true,
        },
      ];

      const totals = calculateCartTotals(items, 0);
      expect(totals.subtotal).toBe(13000);
      expect(totals.total).toBe(13000);
      expect(totals.totalCups).toBe(1);
    });

    it('memproses pembayaran Cash: total Rp13.000, uang Rp15.000, kembalian Rp2.000', () => {
      const total = 13000;
      const tender = 15000;
      const change = calculateChangeDue(total, tender);
      expect(change).toBe(2000);

      const sale = localDb.createSale(
        'TRX-A-001',
        'usr_cashier_001',
        'cash',
        13000,
        0,
        13000,
        tender,
        change,
        'idemp_a_001',
        [
          {
            variant_id: 'var_ms_200',
            product_name: 'Mango Sago',
            variant_name: '200 ml',
            unit_price_idr: 13000,
            quantity: 1,
            line_total_idr: 13000,
            addons: [],
          },
        ]
      );

      expect(sale.id).toBeDefined();
      expect(sale.status).toBe('completed');
      expect(sale.payment_method).toBe('cash');
      expect(sale.cash_received_idr).toBe(15000);
      expect(sale.change_due_idr).toBe(2000);
      expect(sale.items?.length).toBe(1);
      expect(sale.items?.[0].line_total_idr).toBe(13000);
    });
  });

  // -------------------------------------------------------------
  // Skenario B: Add-on & Kuantitas Multi-Cup
  // -------------------------------------------------------------
  describe('Skenario B: Add-on & Kuantitas Multi-Cup', () => {
    it('1 cup varian Rp17.000 + Mix Fruit Rp2.000 = Rp19.000', () => {
      const items: CartItem[] = [
        {
          id: 'var_ms_300__addon_mix_fruit',
          product_id: 'prod_mango_sago',
          product_name: 'Mango Sago',
          variant_id: 'var_ms_300',
          variant_name: '300 ml',
          unit_price_idr: 17000,
          quantity: 1,
          addons: [
            {
              addon_id: 'addon_mix_fruit',
              addon_name: 'Mix Fruit',
              unit_price_idr: 2000,
              quantity: 1,
            },
          ],
          has_recipe: true,
        },
      ];

      const totals = calculateCartTotals(items, 0);
      expect(totals.total).toBe(19000);
      expect(totals.totalCups).toBe(1);
    });

    it('2 cup varian Rp17.000 + Mix Fruit Rp2.000 = Rp38.000 dan add-on line total Rp4.000', () => {
      const items: CartItem[] = [
        {
          id: 'var_ms_300__addon_mix_fruit',
          product_id: 'prod_mango_sago',
          product_name: 'Mango Sago',
          variant_id: 'var_ms_300',
          variant_name: '300 ml',
          unit_price_idr: 17000,
          quantity: 2,
          addons: [
            {
              addon_id: 'addon_mix_fruit',
              addon_name: 'Mix Fruit',
              unit_price_idr: 2000,
              quantity: 1,
            },
          ],
          has_recipe: true,
        },
      ];

      const totals = calculateCartTotals(items, 0);
      expect(totals.total).toBe(38000);
      expect(totals.totalCups).toBe(2);

      const sale = localDb.createSale(
        'TRX-B-002',
        'usr_cashier_001',
        'cash',
        38000,
        0,
        38000,
        38000,
        0,
        'idemp_b_002',
        [
          {
            variant_id: 'var_ms_300',
            product_name: 'Mango Sago',
            variant_name: '300 ml',
            unit_price_idr: 17000,
            quantity: 2,
            line_total_idr: 38000,
            addons: [
              {
                addon_id: 'addon_mix_fruit',
                addon_name: 'Mix Fruit',
                unit_price_idr: 2000,
                quantity: 1,
              },
            ],
          },
        ]
      );

      const item = sale.items?.[0];
      expect(item).toBeDefined();
      expect(item?.quantity).toBe(2);
      expect(item?.line_total_idr).toBe(38000);

      const addon = item?.addons?.[0];
      expect(addon).toBeDefined();
      // Total addon quantity across 2 cups = 2
      expect(addon?.quantity).toBe(2);
      // Total addon line price = 2000 * 2 = 4000
      expect(addon?.line_total_idr).toBe(4000);
    });
  });

  // -------------------------------------------------------------
  // Skenario C: Validasi Pembayaran Cash
  // -------------------------------------------------------------
  describe('Skenario C: Validasi Pembayaran Cash', () => {
    it('menolak uang tunai kurang dari total belanja (calculateChangeDue returns -1)', () => {
      const change = calculateChangeDue(27000, 20000);
      expect(change).toBe(-1);
    });

    it('uang pas menghasilkan kembalian Rp0', () => {
      const change = calculateChangeDue(22000, 22000);
      expect(change).toBe(0);
    });

    it('uang lebih menghitung kembalian akurat', () => {
      const change = calculateChangeDue(17000, 50000);
      expect(change).toBe(33000);
    });
  });

  // -------------------------------------------------------------
  // Skenario D & E: QRIS & Transfer Bank
  // -------------------------------------------------------------
  describe('Skenario D & E: Pembayaran Non-Tunai (QRIS & Transfer)', () => {
    it('mencatat transaksi QRIS dengan referensi GoBiz kasir', () => {
      const sale = localDb.createSale(
        'TRX-QRIS-001',
        'usr_cashier_001',
        'qris',
        22000,
        0,
        22000,
        null,
        null,
        'idemp_qris_001',
        [
          {
            variant_id: 'var_ds_400',
            product_name: 'Dragon Sago',
            variant_name: '400 ml',
            unit_price_idr: 22000,
            quantity: 1,
            line_total_idr: 22000,
            addons: [],
          },
        ],
        { qris_reference: 'GOBIZ-8821' }
      );

      expect(sale.payment_method).toBe('qris');
      expect(sale.qris_reference).toBe('GOBIZ-8821');
      expect(sale.cash_received_idr).toBeNull();
      expect(sale.change_due_idr).toBeNull();
    });

    it('mencatat transaksi Transfer blu by BCA', () => {
      const sale = localDb.createSale(
        'TRX-TF-001',
        'usr_cashier_001',
        'transfer',
        27000,
        0,
        27000,
        null,
        null,
        'idemp_tf_001',
        [
          {
            variant_id: 'var_ss_500',
            product_name: 'Strawberry Sago',
            variant_name: '500 ml',
            unit_price_idr: 27000,
            quantity: 1,
            line_total_idr: 27000,
            addons: [],
          },
        ],
        { notes: 'Transfer blu a/n Yossika Putra Erlangga' }
      );

      expect(sale.payment_method).toBe('transfer');
      expect(sale.total_idr).toBe(27000);
    });

    it('memisahkan kas tunai laci dari pembayaran QRIS dan Transfer dalam laporan keuangan', () => {
      const summary = calculateFinancialMetrics({
        sales: [
          {
            status: 'completed',
            subtotal_idr: 13000,
            discount_idr: 0,
            total_idr: 13000,
            total_cogs_idr: 4500,
            payment_method: 'cash',
            items: [{ quantity: 1 }],
          },
          {
            status: 'completed',
            subtotal_idr: 17000,
            discount_idr: 0,
            total_idr: 17000,
            total_cogs_idr: 6000,
            payment_method: 'qris',
            items: [{ quantity: 1 }],
          },
          {
            status: 'completed',
            subtotal_idr: 22000,
            discount_idr: 0,
            total_idr: 22000,
            total_cogs_idr: 8000,
            payment_method: 'transfer',
            items: [{ quantity: 1 }],
          },
        ],
        expenses: [],
        stockPurchases: [],
      });

      expect(summary.netSales).toBe(52000);
      expect(summary.paymentBreakdown.cash.total).toBe(13000);
      expect(summary.paymentBreakdown.qris.total).toBe(17000);
      expect(summary.paymentBreakdown.transfer.total).toBe(22000);
      expect(summary.cashInflow).toBe(52000);
    });
  });

  // -------------------------------------------------------------
  // Skenario F: Recipe, Stok, Add-on Consumption & HPP
  // -------------------------------------------------------------
  describe('Skenario F: Resep, Stok, Add-on Consumption & HPP', () => {
    it('mengurangi stok bahan varian DAN add-on Mix Fruit saat pesanan terjual', () => {
      const dbBefore = localDb.getDb();
      const initialMangoStock = dbBefore.ingredients.find((i) => i.id === 'ing_mangga')!.stock_base;
      const initialDragonStock = dbBefore.ingredients.find((i) => i.id === 'ing_naga')!.stock_base;
      const initialStrawberryStock = dbBefore.ingredients.find((i) => i.id === 'ing_stroberi')!.stock_base;

      // Sell 1 cup Dragon Sago 200ml with Mix Fruit addon
      // Variant recipe Dragon Sago 200ml: 50g naga
      // Mix Fruit addon recipe: 15g mangga + 15g naga + 15g stroberi
      localDb.createSale(
        'TRX-STK-001',
        'usr_cashier_001',
        'cash',
        15000,
        0,
        15000,
        15000,
        0,
        'idemp_stk_001',
        [
          {
            variant_id: 'var_ds_200',
            product_name: 'Dragon Sago',
            variant_name: '200 ml',
            unit_price_idr: 13000,
            quantity: 1,
            line_total_idr: 15000,
            addons: [
              {
                addon_id: 'addon_mix_fruit',
                addon_name: 'Mix Fruit',
                unit_price_idr: 2000,
                quantity: 1,
              },
            ],
          },
        ]
      );

      const dbAfter = localDb.getDb();
      const afterMangoStock = dbAfter.ingredients.find((i) => i.id === 'ing_mangga')!.stock_base;
      const afterDragonStock = dbAfter.ingredients.find((i) => i.id === 'ing_naga')!.stock_base;
      const afterStrawberryStock = dbAfter.ingredients.find((i) => i.id === 'ing_stroberi')!.stock_base;

      // Mangga: reduced by 15g (from Mix Fruit addon)
      expect(afterMangoStock).toBe(initialMangoStock - 15);
      // Buah Naga: reduced by 50g (variant) + 15g (Mix fruit) = 65g
      expect(afterDragonStock).toBe(initialDragonStock - 65);
      // Stroberi: reduced by 15g (from Mix Fruit addon)
      expect(afterStrawberryStock).toBe(initialStrawberryStock - 15);
    });

    it('menghitung snapshot unit_cogs_idr dan line_cogs_idr dengan nilai akurat > 0', () => {
      const sale = localDb.createSale(
        'TRX-COGS-001',
        'usr_cashier_001',
        'cash',
        13000,
        0,
        13000,
        13000,
        0,
        'idemp_cogs_001',
        [
          {
            variant_id: 'var_ms_200',
            product_name: 'Mango Sago',
            variant_name: '200 ml',
            unit_price_idr: 13000,
            quantity: 2,
            line_total_idr: 26000,
            addons: [],
          },
        ]
      );

      const item = sale.items?.[0];
      expect(item).toBeDefined();
      expect(item?.unit_cogs_idr).toBeGreaterThan(0);
      expect(item?.line_cogs_idr).toBe(item!.unit_cogs_idr * 2);
      expect(sale.total_cogs_idr).toBe(item?.line_cogs_idr);
    });

    it('void transaksi mengembalikan stok tepat 1 kali', () => {
      const dbInit = localDb.getDb();
      const initialMangoStock = dbInit.ingredients.find((i) => i.id === 'ing_mangga')!.stock_base;

      const sale = localDb.createSale(
        'TRX-VOID-001',
        'usr_cashier_001',
        'cash',
        13000,
        0,
        13000,
        13000,
        0,
        'idemp_void_001',
        [
          {
            variant_id: 'var_ms_200',
            product_name: 'Mango Sago',
            variant_name: '200 ml',
            unit_price_idr: 13000,
            quantity: 1,
            line_total_idr: 13000,
            addons: [],
          },
        ]
      );

      // Mango Sago 200ml uses 60g mangga
      const dbSold = localDb.getDb();
      expect(dbSold.ingredients.find((i) => i.id === 'ing_mangga')!.stock_base).toBe(initialMangoStock - 60);

      // Admin voids transaction
      localDb.voidSale(sale.id, 'usr_admin_001', 'Pelanggan salah pesan rasa');

      const dbVoided = localDb.getDb();
      // Stock returned to initial
      expect(dbVoided.ingredients.find((i) => i.id === 'ing_mangga')!.stock_base).toBe(initialMangoStock);

      // Void second time must be idempotent
      localDb.voidSale(sale.id, 'usr_admin_001', 'Pelanggan salah pesan rasa');
      const dbVoidedTwice = localDb.getDb();
      expect(dbVoidedTwice.ingredients.find((i) => i.id === 'ing_mangga')!.stock_base).toBe(initialMangoStock);
    });
  });

  // -------------------------------------------------------------
  // Skenario G: Idempotensi Transaksi
  // -------------------------------------------------------------
  describe('Skenario G: Idempotensi Transaksi', () => {
    it('double click / submit ulang dengan idempotency key yang sama hanya membuat 1 transaksi', () => {
      const key = 'idemp_double_click_test';
      const sale1 = localDb.createSale(
        'TRX-IDEMP-001',
        'usr_cashier_001',
        'cash',
        13000,
        0,
        13000,
        13000,
        0,
        key,
        [
          {
            variant_id: 'var_ds_200',
            product_name: 'Dragon Sago',
            variant_name: '200 ml',
            unit_price_idr: 13000,
            quantity: 1,
            line_total_idr: 13000,
            addons: [],
          },
        ]
      );

      const sale2 = localDb.createSale(
        'TRX-IDEMP-001',
        'usr_cashier_001',
        'cash',
        13000,
        0,
        13000,
        13000,
        0,
        key,
        [
          {
            variant_id: 'var_ds_200',
            product_name: 'Dragon Sago',
            variant_name: '200 ml',
            unit_price_idr: 13000,
            quantity: 1,
            line_total_idr: 13000,
            addons: [],
          },
        ]
      );

      expect(sale1.id).toBe(sale2.id);
      const db = localDb.getDb();
      const matches = db.sales.filter((s) => s.idempotency_key === key);
      expect(matches.length).toBe(1);
    });
  });
});
