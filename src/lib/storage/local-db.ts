// Local Database & Storage Engine for NyeniPOS
// Standalone, self-contained persistence using browser LocalStorage
// Provides zero-external-dependency operation, full offline PWA capability,
// and instant deployment to Vercel without Supabase setup.

import {
  Profile,
  Product,
  ProductVariant,
  Addon,
  Ingredient,
  VariantRecipeItem,
  Sale,
  SaleItem,
  SaleItemAddon,
  StockPurchase,
  StockPurchaseItem,
  Expense,
  AuditLog,
  BusinessSettings,
  PaymentMethod,
} from '../../types';
import { calculateWeightedAverageCost } from '../calculations';
import { generateReceiptNumber } from '../format';

const STORAGE_KEY = 'nyeni_pos_database_v2';
const OLD_STORAGE_KEY = 'nyeni_pos_database_v1';
const SESSION_COOKIE = 'nyeni_session';
const LAST_LOGIN_KEY = 'nyeni_last_login';

export interface RememberedAccount {
  username: string;
  fullName: string;
  role: 'admin' | 'cashier';
  savedAt: string;
}

export interface DatabaseSchema {
  profiles: Profile[];
  products: Product[];
  product_variants: ProductVariant[];
  addons: Addon[];
  ingredients: Ingredient[];
  variant_recipe_items: VariantRecipeItem[];
  sales: Sale[];
  sale_items: SaleItem[];
  sale_item_addons: SaleItemAddon[];
  inventory_movements: any[];
  stock_purchases: StockPurchase[];
  stock_purchase_items: StockPurchaseItem[];
  expenses: Expense[];
  audit_logs: AuditLog[];
  business_settings: BusinessSettings;
  credentials: Record<string, string>; // email -> password
}

// -------------------------------------------------------------
// DEFAULT SEED DATA
// -------------------------------------------------------------
export const DEFAULT_DATABASE: DatabaseSchema = {
  profiles: [
    {
      id: 'usr_admin_001',
      username: 'admin',
      email: 'admin@magi.com',
      full_name: 'Owner & General Manager (Admin)',
      role: 'admin',
      is_active: true,
      created_at: '2026-10-26T00:00:00.000Z',
      updated_at: '2026-10-26T00:00:00.000Z',
    },
    {
      id: 'usr_cashier_001',
      username: 'kasir_yossika',
      email: 'kasir_yossika@magi.com',
      full_name: 'Yossika (Kasir Utama)',
      role: 'cashier',
      is_active: true,
      created_at: '2026-10-26T00:00:00.000Z',
      updated_at: '2026-10-26T00:00:00.000Z',
    },
  ],
  credentials: {
    'admin': 'admin123',
    'admin@magi.com': 'admin123',
    'admin@mangonyeni.com': 'admin123',
    'kasir_yossika': 'kasirsukses2026',
    'kasir_yossika@magi.com': 'kasirsukses2026',
    'kasir': 'kasir123',
    'kasir@mangonyeni.com': 'kasir123',
  },
  products: [
    {
      id: 'prod_dragon_sago',
      name: 'Dragon Sago',
      description: 'Dessert cup segar dengan perpaduan buah naga merah pilihan, sagu mutiara, dan kuah creamy spesial Mango Nyeni.',
      category: 'Dessert Cup',
      image_path: '/assets/dragon-sago-only.webp',
      is_active: true,
      sort_order: 1,
      created_at: '2026-10-26T00:00:00.000Z',
      updated_at: '2026-10-26T00:00:00.000Z',
    },
    {
      id: 'prod_mango_sago',
      name: 'Mango Sago',
      description: 'Dessert cup signature dengan mangga harum manis legit berlimpah, jelly mangga, dan racikan susu gurih manis.',
      category: 'Dessert Cup',
      image_path: '/assets/mango-sago-splash-stack.webp',
      is_active: true,
      sort_order: 2,
      created_at: '2026-10-26T00:00:00.000Z',
      updated_at: '2026-10-26T00:00:00.000Z',
    },
    {
      id: 'prod_strawberry_sago',
      name: 'Strawberry Sago',
      description: 'Dessert cup sensasi asam manis stroberi segar dengan sagu mutiara kenyal dan kuah susu kental manis gurih.',
      category: 'Dessert Cup',
      image_path: '/assets/strawberry-sago-only.webp',
      is_active: true,
      sort_order: 3,
      created_at: '2026-10-26T00:00:00.000Z',
      updated_at: '2026-10-26T00:00:00.000Z',
    },
  ],
  product_variants: [
    // Dragon Sago
    { id: 'var_ds_200', product_id: 'prod_dragon_sago', name: '200 ml', volume_ml: 200, price_idr: 13000, is_active: true, created_at: '2026-10-26T00:00:00.000Z', updated_at: '2026-10-26T00:00:00.000Z' },
    { id: 'var_ds_300', product_id: 'prod_dragon_sago', name: '300 ml', volume_ml: 300, price_idr: 17000, is_active: true, created_at: '2026-10-26T00:00:00.000Z', updated_at: '2026-10-26T00:00:00.000Z' },
    { id: 'var_ds_400', product_id: 'prod_dragon_sago', name: '400 ml', volume_ml: 400, price_idr: 22000, is_active: true, created_at: '2026-10-26T00:00:00.000Z', updated_at: '2026-10-26T00:00:00.000Z' },
    { id: 'var_ds_500', product_id: 'prod_dragon_sago', name: '500 ml', volume_ml: 500, price_idr: 27000, is_active: true, created_at: '2026-10-26T00:00:00.000Z', updated_at: '2026-10-26T00:00:00.000Z' },
    // Mango Sago
    { id: 'var_ms_200', product_id: 'prod_mango_sago', name: '200 ml', volume_ml: 200, price_idr: 13000, is_active: true, created_at: '2026-10-26T00:00:00.000Z', updated_at: '2026-10-26T00:00:00.000Z' },
    { id: 'var_ms_300', product_id: 'prod_mango_sago', name: '300 ml', volume_ml: 300, price_idr: 17000, is_active: true, created_at: '2026-10-26T00:00:00.000Z', updated_at: '2026-10-26T00:00:00.000Z' },
    { id: 'var_ms_400', product_id: 'prod_mango_sago', name: '400 ml', volume_ml: 400, price_idr: 22000, is_active: true, created_at: '2026-10-26T00:00:00.000Z', updated_at: '2026-10-26T00:00:00.000Z' },
    { id: 'var_ms_500', product_id: 'prod_mango_sago', name: '500 ml', volume_ml: 500, price_idr: 27000, is_active: true, created_at: '2026-10-26T00:00:00.000Z', updated_at: '2026-10-26T00:00:00.000Z' },
    // Strawberry Sago
    { id: 'var_ss_200', product_id: 'prod_strawberry_sago', name: '200 ml', volume_ml: 200, price_idr: 13000, is_active: true, created_at: '2026-10-26T00:00:00.000Z', updated_at: '2026-10-26T00:00:00.000Z' },
    { id: 'var_ss_300', product_id: 'prod_strawberry_sago', name: '300 ml', volume_ml: 300, price_idr: 17000, is_active: true, created_at: '2026-10-26T00:00:00.000Z', updated_at: '2026-10-26T00:00:00.000Z' },
    { id: 'var_ss_400', product_id: 'prod_strawberry_sago', name: '400 ml', volume_ml: 400, price_idr: 22000, is_active: true, created_at: '2026-10-26T00:00:00.000Z', updated_at: '2026-10-26T00:00:00.000Z' },
    { id: 'var_ss_500', product_id: 'prod_strawberry_sago', name: '500 ml', volume_ml: 500, price_idr: 27000, is_active: true, created_at: '2026-10-26T00:00:00.000Z', updated_at: '2026-10-26T00:00:00.000Z' },
  ],
  addons: [
    {
      id: 'addon_mix_fruit',
      name: 'Mix Fruit',
      price_idr: 2000,
      is_active: true,
      created_at: '2026-10-26T00:00:00.000Z',
      updated_at: '2026-10-26T00:00:00.000Z',
    },
  ],
  ingredients: [
    { id: 'ing_mangga', name: 'Mangga Harum Manis', base_unit: 'g', purchase_unit: 'kg', conversion_to_base: 1000, stock_base: 15000, minimum_stock_base: 2000, average_cost_per_base: 35, is_active: true, created_at: '2026-10-26T00:00:00.000Z', updated_at: '2026-10-26T00:00:00.000Z' },
    { id: 'ing_naga', name: 'Buah Naga Merah', base_unit: 'g', purchase_unit: 'kg', conversion_to_base: 1000, stock_base: 12000, minimum_stock_base: 1500, average_cost_per_base: 25, is_active: true, created_at: '2026-10-26T00:00:00.000Z', updated_at: '2026-10-26T00:00:00.000Z' },
    { id: 'ing_stroberi', name: 'Stroberi Segar', base_unit: 'g', purchase_unit: 'kg', conversion_to_base: 1000, stock_base: 8000, minimum_stock_base: 1000, average_cost_per_base: 45, is_active: true, created_at: '2026-10-26T00:00:00.000Z', updated_at: '2026-10-26T00:00:00.000Z' },
    { id: 'ing_sagu', name: 'Sagu Mutiara', base_unit: 'g', purchase_unit: 'kg', conversion_to_base: 1000, stock_base: 10000, minimum_stock_base: 2000, average_cost_per_base: 18, is_active: true, created_at: '2026-10-26T00:00:00.000Z', updated_at: '2026-10-26T00:00:00.000Z' },
    { id: 'ing_susu', name: 'Susu Evaporasi & Creamer', base_unit: 'ml', purchase_unit: 'liter', conversion_to_base: 1000, stock_base: 20000, minimum_stock_base: 3000, average_cost_per_base: 22, is_active: true, created_at: '2026-10-26T00:00:00.000Z', updated_at: '2026-10-26T00:00:00.000Z' },
    { id: 'ing_gula', name: 'Sirup Gula Racikan', base_unit: 'ml', purchase_unit: 'liter', conversion_to_base: 1000, stock_base: 15000, minimum_stock_base: 2000, average_cost_per_base: 15, is_active: true, created_at: '2026-10-26T00:00:00.000Z', updated_at: '2026-10-26T00:00:00.000Z' },
    { id: 'ing_cup_200', name: 'Cup + Tutup 200 ml', base_unit: 'pcs', purchase_unit: 'pack (50 pcs)', conversion_to_base: 50, stock_base: 300, minimum_stock_base: 50, average_cost_per_base: 450, is_active: true, created_at: '2026-10-26T00:00:00.000Z', updated_at: '2026-10-26T00:00:00.000Z' },
    { id: 'ing_cup_300', name: 'Cup + Tutup 300 ml', base_unit: 'pcs', purchase_unit: 'pack (50 pcs)', conversion_to_base: 50, stock_base: 300, minimum_stock_base: 50, average_cost_per_base: 550, is_active: true, created_at: '2026-10-26T00:00:00.000Z', updated_at: '2026-10-26T00:00:00.000Z' },
    { id: 'ing_cup_400', name: 'Cup + Tutup 400 ml', base_unit: 'pcs', purchase_unit: 'pack (50 pcs)', conversion_to_base: 50, stock_base: 300, minimum_stock_base: 50, average_cost_per_base: 650, is_active: true, created_at: '2026-10-26T00:00:00.000Z', updated_at: '2026-10-26T00:00:00.000Z' },
    { id: 'ing_cup_500', name: 'Cup + Tutup 500 ml', base_unit: 'pcs', purchase_unit: 'pack (50 pcs)', conversion_to_base: 50, stock_base: 300, minimum_stock_base: 50, average_cost_per_base: 750, is_active: true, created_at: '2026-10-26T00:00:00.000Z', updated_at: '2026-10-26T00:00:00.000Z' },
    { id: 'ing_sendok', name: 'Sendok Higienis', base_unit: 'pcs', purchase_unit: 'pack (100 pcs)', conversion_to_base: 100, stock_base: 500, minimum_stock_base: 100, average_cost_per_base: 120, is_active: true, created_at: '2026-10-26T00:00:00.000Z', updated_at: '2026-10-26T00:00:00.000Z' },
  ],
  // Pre-configured standard recipe items so POS works instantly out of the box!
  // Can be adjusted anytime by Admin via Menu & Resep editor
  variant_recipe_items: [
    // Dragon Sago 200ml
    { id: 'rcp_ds_200_1', variant_id: 'var_ds_200', ingredient_id: 'ing_naga', quantity_base_per_serving: 50, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ds_200_2', variant_id: 'var_ds_200', ingredient_id: 'ing_sagu', quantity_base_per_serving: 30, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ds_200_3', variant_id: 'var_ds_200', ingredient_id: 'ing_susu', quantity_base_per_serving: 60, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ds_200_4', variant_id: 'var_ds_200', ingredient_id: 'ing_cup_200', quantity_base_per_serving: 1, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ds_200_5', variant_id: 'var_ds_200', ingredient_id: 'ing_sendok', quantity_base_per_serving: 1, created_at: '2026-10-26T00:00:00.000Z' },
    // Dragon Sago 300ml
    { id: 'rcp_ds_300_1', variant_id: 'var_ds_300', ingredient_id: 'ing_naga', quantity_base_per_serving: 75, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ds_300_2', variant_id: 'var_ds_300', ingredient_id: 'ing_sagu', quantity_base_per_serving: 45, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ds_300_3', variant_id: 'var_ds_300', ingredient_id: 'ing_susu', quantity_base_per_serving: 90, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ds_300_4', variant_id: 'var_ds_300', ingredient_id: 'ing_cup_300', quantity_base_per_serving: 1, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ds_300_5', variant_id: 'var_ds_300', ingredient_id: 'ing_sendok', quantity_base_per_serving: 1, created_at: '2026-10-26T00:00:00.000Z' },
    // Dragon Sago 400ml
    { id: 'rcp_ds_400_1', variant_id: 'var_ds_400', ingredient_id: 'ing_naga', quantity_base_per_serving: 100, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ds_400_2', variant_id: 'var_ds_400', ingredient_id: 'ing_sagu', quantity_base_per_serving: 60, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ds_400_3', variant_id: 'var_ds_400', ingredient_id: 'ing_susu', quantity_base_per_serving: 120, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ds_400_4', variant_id: 'var_ds_400', ingredient_id: 'ing_cup_400', quantity_base_per_serving: 1, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ds_400_5', variant_id: 'var_ds_400', ingredient_id: 'ing_sendok', quantity_base_per_serving: 1, created_at: '2026-10-26T00:00:00.000Z' },
    // Dragon Sago 500ml
    { id: 'rcp_ds_500_1', variant_id: 'var_ds_500', ingredient_id: 'ing_naga', quantity_base_per_serving: 125, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ds_500_2', variant_id: 'var_ds_500', ingredient_id: 'ing_sagu', quantity_base_per_serving: 75, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ds_500_3', variant_id: 'var_ds_500', ingredient_id: 'ing_susu', quantity_base_per_serving: 150, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ds_500_4', variant_id: 'var_ds_500', ingredient_id: 'ing_cup_500', quantity_base_per_serving: 1, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ds_500_5', variant_id: 'var_ds_500', ingredient_id: 'ing_sendok', quantity_base_per_serving: 1, created_at: '2026-10-26T00:00:00.000Z' },

    // Mango Sago 200ml
    { id: 'rcp_ms_200_1', variant_id: 'var_ms_200', ingredient_id: 'ing_mangga', quantity_base_per_serving: 60, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ms_200_2', variant_id: 'var_ms_200', ingredient_id: 'ing_sagu', quantity_base_per_serving: 30, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ms_200_3', variant_id: 'var_ms_200', ingredient_id: 'ing_susu', quantity_base_per_serving: 60, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ms_200_4', variant_id: 'var_ms_200', ingredient_id: 'ing_cup_200', quantity_base_per_serving: 1, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ms_200_5', variant_id: 'var_ms_200', ingredient_id: 'ing_sendok', quantity_base_per_serving: 1, created_at: '2026-10-26T00:00:00.000Z' },
    // Mango Sago 300ml
    { id: 'rcp_ms_300_1', variant_id: 'var_ms_300', ingredient_id: 'ing_mangga', quantity_base_per_serving: 90, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ms_300_2', variant_id: 'var_ms_300', ingredient_id: 'ing_sagu', quantity_base_per_serving: 45, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ms_300_3', variant_id: 'var_ms_300', ingredient_id: 'ing_susu', quantity_base_per_serving: 90, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ms_300_4', variant_id: 'var_ms_300', ingredient_id: 'ing_cup_300', quantity_base_per_serving: 1, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ms_300_5', variant_id: 'var_ms_300', ingredient_id: 'ing_sendok', quantity_base_per_serving: 1, created_at: '2026-10-26T00:00:00.000Z' },
    // Mango Sago 400ml
    { id: 'rcp_ms_400_1', variant_id: 'var_ms_400', ingredient_id: 'ing_mangga', quantity_base_per_serving: 120, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ms_400_2', variant_id: 'var_ms_400', ingredient_id: 'ing_sagu', quantity_base_per_serving: 60, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ms_400_3', variant_id: 'var_ms_400', ingredient_id: 'ing_susu', quantity_base_per_serving: 120, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ms_400_4', variant_id: 'var_ms_400', ingredient_id: 'ing_cup_400', quantity_base_per_serving: 1, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ms_400_5', variant_id: 'var_ms_400', ingredient_id: 'ing_sendok', quantity_base_per_serving: 1, created_at: '2026-10-26T00:00:00.000Z' },
    // Mango Sago 500ml
    { id: 'rcp_ms_500_1', variant_id: 'var_ms_500', ingredient_id: 'ing_mangga', quantity_base_per_serving: 150, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ms_500_2', variant_id: 'var_ms_500', ingredient_id: 'ing_sagu', quantity_base_per_serving: 75, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ms_500_3', variant_id: 'var_ms_500', ingredient_id: 'ing_susu', quantity_base_per_serving: 150, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ms_500_4', variant_id: 'var_ms_500', ingredient_id: 'ing_cup_500', quantity_base_per_serving: 1, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ms_500_5', variant_id: 'var_ms_500', ingredient_id: 'ing_sendok', quantity_base_per_serving: 1, created_at: '2026-10-26T00:00:00.000Z' },

    // Strawberry Sago 200ml
    { id: 'rcp_ss_200_1', variant_id: 'var_ss_200', ingredient_id: 'ing_stroberi', quantity_base_per_serving: 50, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ss_200_2', variant_id: 'var_ss_200', ingredient_id: 'ing_sagu', quantity_base_per_serving: 30, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ss_200_3', variant_id: 'var_ss_200', ingredient_id: 'ing_susu', quantity_base_per_serving: 60, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ss_200_4', variant_id: 'var_ss_200', ingredient_id: 'ing_cup_200', quantity_base_per_serving: 1, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ss_200_5', variant_id: 'var_ss_200', ingredient_id: 'ing_sendok', quantity_base_per_serving: 1, created_at: '2026-10-26T00:00:00.000Z' },
    // Strawberry Sago 300ml
    { id: 'rcp_ss_300_1', variant_id: 'var_ss_300', ingredient_id: 'ing_stroberi', quantity_base_per_serving: 75, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ss_300_2', variant_id: 'var_ss_300', ingredient_id: 'ing_sagu', quantity_base_per_serving: 45, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ss_300_3', variant_id: 'var_ss_300', ingredient_id: 'ing_susu', quantity_base_per_serving: 90, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ss_300_4', variant_id: 'var_ss_300', ingredient_id: 'ing_cup_300', quantity_base_per_serving: 1, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ss_300_5', variant_id: 'var_ss_300', ingredient_id: 'ing_sendok', quantity_base_per_serving: 1, created_at: '2026-10-26T00:00:00.000Z' },
    // Strawberry Sago 400ml
    { id: 'rcp_ss_400_1', variant_id: 'var_ss_400', ingredient_id: 'ing_stroberi', quantity_base_per_serving: 100, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ss_400_2', variant_id: 'var_ss_400', ingredient_id: 'ing_sagu', quantity_base_per_serving: 60, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ss_400_3', variant_id: 'var_ss_400', ingredient_id: 'ing_susu', quantity_base_per_serving: 120, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ss_400_4', variant_id: 'var_ss_400', ingredient_id: 'ing_cup_400', quantity_base_per_serving: 1, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ss_400_5', variant_id: 'var_ss_400', ingredient_id: 'ing_sendok', quantity_base_per_serving: 1, created_at: '2026-10-26T00:00:00.000Z' },
    // Strawberry Sago 500ml
    { id: 'rcp_ss_500_1', variant_id: 'var_ss_500', ingredient_id: 'ing_stroberi', quantity_base_per_serving: 125, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ss_500_2', variant_id: 'var_ss_500', ingredient_id: 'ing_sagu', quantity_base_per_serving: 75, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ss_500_3', variant_id: 'var_ss_500', ingredient_id: 'ing_susu', quantity_base_per_serving: 150, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ss_500_4', variant_id: 'var_ss_500', ingredient_id: 'ing_cup_500', quantity_base_per_serving: 1, created_at: '2026-10-26T00:00:00.000Z' },
    { id: 'rcp_ss_500_5', variant_id: 'var_ss_500', ingredient_id: 'ing_sendok', quantity_base_per_serving: 1, created_at: '2026-10-26T00:00:00.000Z' },
  ],
  sales: [],
  sale_items: [],
  sale_item_addons: [],
  inventory_movements: [],
  stock_purchases: [],
  stock_purchase_items: [],
  expenses: [],
  audit_logs: [
    {
      id: 'log_init',
      actor_id: 'usr_admin_001',
      action: 'SYSTEM_BOOTSTRAP',
      entity_type: 'system',
      entity_id: 'init',
      before_data: null,
      after_data: { initialized: true },
      reason: 'Inisialisasi sistem database mandiri NyeniPOS',
      created_at: '2026-10-26T00:00:00.000Z',
    },
  ],
  business_settings: {
    id: 'setting_main',
    business_name: 'Mango Nyeni',
    store_address: 'Jl. Senopati No. 42, Jakarta Selatan',
    receipt_header: 'Sensasi Dessert Sago Asli & Creamy!',
    receipt_footer: 'Terima kasih telah menikmati Mango Nyeni! Jangan lupa tag kami di Instagram.',
    timezone: 'Asia/Jakarta',
    enable_cash: true,
    enable_qris: true,
    enable_transfer: true,
    instagram_url: '',
    updated_at: '2026-10-26T00:00:00.000Z',
  },
};

// -------------------------------------------------------------
// STORAGE MANAGER CLASS
// -------------------------------------------------------------
class LocalStoreManager {
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  public getDb(): DatabaseSchema {
    if (!this.isBrowser()) {
      return DEFAULT_DATABASE;
    }

    try {
      let stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        const oldStored = window.localStorage.getItem(OLD_STORAGE_KEY);
        if (oldStored) {
          stored = oldStored;
        } else {
          this.saveDb(DEFAULT_DATABASE);
          return DEFAULT_DATABASE;
        }
      }
      const db = JSON.parse(stored) as DatabaseSchema;

      let modified = false;
      if (!db.credentials) {
        db.credentials = {};
        modified = true;
      }

      // Hard guarantee: Ensure default credentials always exist and are valid
      const defaultCreds: Record<string, string> = {
        admin: 'admin123',
        'admin@magi.com': 'admin123',
        'admin@mangonyeni.com': 'admin123',
        kasir_yossika: 'kasirsukses2026',
        'kasir_yossika@magi.com': 'kasirsukses2026',
        kasir: 'kasirsukses2026',
        'kasir@mangonyeni.com': 'kasirsukses2026',
      };
      for (const [key, val] of Object.entries(defaultCreds)) {
        if (db.credentials[key] !== val) {
          db.credentials[key] = val;
          modified = true;
        }
      }

      // Hard guarantee: Ensure Admin profile exists with username 'admin'
      let admin = db.profiles.find((p) => p.role === 'admin' || p.username === 'admin');
      if (admin) {
        if (admin.username !== 'admin') {
          admin.username = 'admin';
          modified = true;
        }
        if (!admin.email) {
          admin.email = 'admin@magi.com';
          modified = true;
        }
        admin.is_active = true;
      } else {
        admin = { ...DEFAULT_DATABASE.profiles[0] };
        db.profiles.unshift(admin);
        modified = true;
      }

      // Hard guarantee: Ensure Cashier profile exists with username 'kasir_yossika'
      let cashier = db.profiles.find(
        (p) => p.role === 'cashier' || p.username === 'kasir_yossika' || p.username === 'kasir'
      );
      if (cashier) {
        if (cashier.username !== 'kasir_yossika') {
          cashier.username = 'kasir_yossika';
          modified = true;
        }
        if (!cashier.email) {
          cashier.email = 'kasir_yossika@magi.com';
          modified = true;
        }
        if (cashier.full_name !== 'Yossika (Kasir Utama)' && !cashier.full_name.includes('Yossika')) {
          cashier.full_name = 'Yossika (Kasir Utama)';
          modified = true;
        }
        cashier.is_active = true;
      } else {
        cashier = { ...DEFAULT_DATABASE.profiles[1] };
        db.profiles.push(cashier);
        modified = true;
      }

      // Update image paths to isolated WebP product objects
      for (const p of db.products || []) {
        if (p.id === 'prod_dragon_sago' && (!p.image_path || p.image_path.includes('naga-sago-splash-promo') || p.image_path.includes('.png'))) {
          p.image_path = '/assets/dragon-sago-only.webp';
          modified = true;
        } else if (p.id === 'prod_mango_sago' && (!p.image_path || p.image_path.includes('.png'))) {
          p.image_path = '/assets/mango-sago-splash-stack.webp';
          modified = true;
        } else if (p.id === 'prod_strawberry_sago' && (!p.image_path || p.image_path.includes('strawberry-sago-summer-delight') || p.image_path.includes('.png'))) {
          p.image_path = '/assets/strawberry-sago-only.webp';
          modified = true;
        }
      }

      // Ensure all profiles have username
      for (const u of db.profiles || []) {
        if (!u.username) {
          u.username = u.email ? u.email.split('@')[0] : `user_${u.id}`;
          modified = true;
        }
      }

      if (modified) {
        this.saveDb(db);
      }
      return db;
    } catch (err) {
      console.error('Failed to parse local database:', err);
      return DEFAULT_DATABASE;
    }
  }

  public saveDb(db: DatabaseSchema): void {
    if (!this.isBrowser()) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (err) {
      console.error('Failed to save to local database:', err);
    }
  }

  public resetToDefault(): void {
    if (!this.isBrowser()) return;
    this.saveDb(DEFAULT_DATABASE);
  }

  // ---------------- AUTH ----------------
  public setSessionCookie(profile: Profile): void {
    if (this.isBrowser()) {
      document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(
        JSON.stringify({ id: profile.id, role: profile.role, username: profile.username })
      )}; path=/; max-age=86400; SameSite=Lax`;
    }
  }

  public saveRememberedUser(data: { username: string; fullName: string; role: 'admin' | 'cashier' }): void {
    if (!this.isBrowser()) return;
    try {
      window.localStorage.setItem(
        LAST_LOGIN_KEY,
        JSON.stringify({
          ...data,
          savedAt: new Date().toISOString(),
        })
      );
    } catch {
      // ignore
    }
  }

  public getRememberedUser(): RememberedAccount | null {
    if (!this.isBrowser()) return null;
    try {
      const stored = window.localStorage.getItem(LAST_LOGIN_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as RememberedAccount;
    } catch {
      return null;
    }
  }

  public clearRememberedUser(): void {
    if (!this.isBrowser()) return;
    try {
      window.localStorage.removeItem(LAST_LOGIN_KEY);
    } catch {
      // ignore
    }
  }

  public login(identifier: string, pass: string): { user: Profile; token: string } | null {
    const db = this.getDb();
    const cleanId = identifier.toLowerCase().trim();

    // 1. Direct hardcoded fallback checks for demo reliability:
    if (
      (cleanId === 'admin' || cleanId === 'admin@magi.com' || cleanId === 'admin@mangonyeni.com') &&
      pass === 'admin123'
    ) {
      const adminUser = db.profiles.find((p) => p.role === 'admin') || DEFAULT_DATABASE.profiles[0];
      this.setSessionCookie(adminUser);
      this.saveRememberedUser({
        username: adminUser.username || 'admin',
        fullName: adminUser.full_name,
        role: 'admin',
      });
      return { user: adminUser, token: adminUser.id };
    }

    if (
      (cleanId === 'kasir_yossika' ||
        cleanId === 'kasir' ||
        cleanId === 'kasir_yossika@magi.com' ||
        cleanId === 'kasir@mangonyeni.com') &&
      (pass === 'kasirsukses2026' || pass === 'kasir123')
    ) {
      const cashierUser =
        db.profiles.find((p) => p.role === 'cashier' && p.username === 'kasir_yossika') ||
        db.profiles.find((p) => p.role === 'cashier') ||
        DEFAULT_DATABASE.profiles[1];
      this.setSessionCookie(cashierUser);
      this.saveRememberedUser({
        username: cashierUser.username || 'kasir_yossika',
        fullName: cashierUser.full_name,
        role: 'cashier',
      });
      return { user: cashierUser, token: cashierUser.id };
    }

    // 2. Generic profile matching by username or email
    const profile = db.profiles.find(
      (p) =>
        (p.username?.toLowerCase() === cleanId || p.email?.toLowerCase() === cleanId) &&
        p.is_active
    );

    if (!profile) return null;

    // Check credentials by cleanId, profile.username, or profile.email
    const expectedPass =
      db.credentials[cleanId] ||
      (profile.username ? db.credentials[profile.username.toLowerCase()] : undefined) ||
      (profile.email ? db.credentials[profile.email.toLowerCase()] : undefined);

    if (!expectedPass || expectedPass !== pass) {
      return null;
    }

    this.setSessionCookie(profile);
    this.saveRememberedUser({
      username: profile.username || cleanId,
      fullName: profile.full_name,
      role: profile.role,
    });
    return { user: profile, token: profile.id };
  }

  public logout(): void {
    if (this.isBrowser()) {
      document.cookie = `${SESSION_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  }

  public getSessionUser(): Profile | null {
    if (!this.isBrowser()) return DEFAULT_DATABASE.profiles[0];

    const match = document.cookie.match(new RegExp('(^| )' + SESSION_COOKIE + '=([^;]+)'));
    if (!match) return null;

    try {
      const sessionData = JSON.parse(decodeURIComponent(match[2]));
      const db = this.getDb();
      return db.profiles.find((p) => p.id === sessionData.id && p.is_active) || null;
    } catch {
      return null;
    }
  }

  // ---------------- PRODUCTS & RECIPES ----------------
  public getProductsWithVariants(): Product[] {
    const db = this.getDb();
    return db.products.map((prod) => ({
      ...prod,
      variants: db.product_variants
        .filter((v) => v.product_id === prod.id && v.is_active)
        .map((v) => ({
          ...v,
          recipe_items: db.variant_recipe_items
            .filter((r) => r.variant_id === v.id)
            .map((r) => ({
              ...r,
              ingredient: db.ingredients.find((i) => i.id === r.ingredient_id),
            })),
        })),
    }));
  }

  public updateVariantPrice(variantId: string, newPrice: number): void {
    const db = this.getDb();
    const variant = db.product_variants.find((v) => v.id === variantId);
    if (variant) {
      variant.price_idr = newPrice;
      variant.updated_at = new Date().toISOString();
      this.saveDb(db);
    }
  }

  public updateRecipe(variantId: string, items: Array<{ ingredient_id: string; quantity: number }>): void {
    const db = this.getDb();
    // remove existing
    db.variant_recipe_items = db.variant_recipe_items.filter((r) => r.variant_id !== variantId);

    // add new
    for (const item of items) {
      db.variant_recipe_items.push({
        id: `rcp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        variant_id: variantId,
        ingredient_id: item.ingredient_id,
        quantity_base_per_serving: item.quantity,
        created_at: new Date().toISOString(),
      });
    }

    this.saveDb(db);
  }

  // ---------------- INGREDIENTS & STOCK ----------------
  public getIngredients(): Ingredient[] {
    const db = this.getDb();
    return db.ingredients.filter((i) => i.is_active);
  }

  public addIngredient(data: Omit<Ingredient, 'id' | 'created_at' | 'updated_at' | 'is_active'>): Ingredient {
    const db = this.getDb();
    const newIng: Ingredient = {
      ...data,
      id: `ing_${Date.now()}`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.ingredients.push(newIng);
    this.saveDb(db);
    return newIng;
  }

  public recordAdjustment(
    ingredientId: string,
    type: 'waste' | 'adjustment_in' | 'adjustment_out',
    delta: number,
    reason: string,
    userId: string
  ): void {
    const db = this.getDb();
    const ing = db.ingredients.find((i) => i.id === ingredientId);
    if (!ing) throw new Error('Bahan baku tidak ditemukan.');

    const newStock = ing.stock_base + delta;
    if (newStock < 0) throw new Error('Pengurangan melebihi stok yang tersedia.');

    ing.stock_base = newStock;
    ing.updated_at = new Date().toISOString();

    db.inventory_movements.push({
      id: `mov_${Date.now()}`,
      ingredient_id: ingredientId,
      movement_type: type,
      quantity_delta_base: delta,
      unit_cost_snapshot: ing.average_cost_per_base,
      reference_type: 'manual',
      reason,
      created_by: userId,
      created_at: new Date().toISOString(),
      ingredient: ing,
    });

    db.audit_logs.push({
      id: `log_${Date.now()}`,
      actor_id: userId,
      action: 'INVENTORY_ADJUSTMENT',
      entity_type: 'ingredient',
      entity_id: ingredientId,
      before_data: { old_stock: ing.stock_base - delta },
      after_data: { new_stock: newStock, type, delta },
      reason,
      created_at: new Date().toISOString(),
    });

    this.saveDb(db);
  }

  // ---------------- PURCHASES / RESTOCK ----------------
  public recordPurchase(
    purchaseNumber: string,
    supplierName: string | null,
    purchaseDate: string,
    paymentStatus: 'paid' | 'pending',
    notes: string | null,
    items: Array<{
      ingredient_id: string;
      purchase_quantity: number;
      purchase_unit: string;
      conversion_to_base: number;
      unit_cost_idr: number;
      line_total_idr: number;
    }>,
    userId: string
  ): StockPurchase {
    const db = this.getDb();
    const totalCost = items.reduce((acc, i) => acc + i.line_total_idr, 0);

    const newPo: StockPurchase = {
      id: `po_${Date.now()}`,
      purchase_number: purchaseNumber,
      supplier_name: supplierName,
      purchase_date: purchaseDate,
      total_cost_idr: totalCost,
      payment_status: paymentStatus,
      notes,
      created_by: userId,
      created_at: new Date().toISOString(),
      creator: db.profiles.find((p) => p.id === userId),
      items: [],
    };

    for (const it of items) {
      const ing = db.ingredients.find((i) => i.id === it.ingredient_id);
      if (!ing) continue;

      const baseQty = it.purchase_quantity * it.conversion_to_base;
      const costPerBase = it.unit_cost_idr / it.conversion_to_base;

      // Update weighted average cost
      const newAvgCost = calculateWeightedAverageCost(
        ing.stock_base,
        ing.average_cost_per_base,
        baseQty,
        costPerBase
      );

      ing.stock_base += baseQty;
      ing.average_cost_per_base = newAvgCost;
      ing.updated_at = new Date().toISOString();

      const poItem: StockPurchaseItem = {
        id: `poi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        purchase_id: newPo.id,
        ingredient_id: it.ingredient_id,
        purchase_quantity: it.purchase_quantity,
        purchase_unit_snapshot: it.purchase_unit,
        conversion_to_base_snapshot: it.conversion_to_base,
        base_quantity: baseQty,
        unit_cost_idr: it.unit_cost_idr,
        line_total_idr: it.line_total_idr,
        created_at: new Date().toISOString(),
        ingredient: ing,
      };

      db.stock_purchase_items.push(poItem);
      newPo.items?.push(poItem);

      db.inventory_movements.push({
        id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        ingredient_id: it.ingredient_id,
        movement_type: 'purchase',
        quantity_delta_base: baseQty,
        unit_cost_snapshot: costPerBase,
        reference_type: 'purchase',
        reference_id: newPo.id,
        reason: `Restock #${purchaseNumber} (${supplierName || 'Umum'})`,
        created_by: userId,
        created_at: new Date().toISOString(),
        ingredient: ing,
      });
    }

    db.stock_purchases.push(newPo);
    this.saveDb(db);
    return newPo;
  }

  // ---------------- SALES & VOID ----------------
  public createSale(
    receiptNumber: string,
    cashierId: string,
    paymentMethod: PaymentMethod,
    subtotalIdr: number,
    discountIdr: number,
    totalIdr: number,
    cashReceivedIdr: number | null,
    changeDueIdr: number | null,
    idempotencyKey: string,
    items: Array<{
      variant_id: string;
      product_name: string;
      variant_name: string;
      unit_price_idr: number;
      quantity: number;
      line_total_idr: number;
      addons?: Array<{
        addon_id: string;
        addon_name: string;
        unit_price_idr: number;
        quantity: number;
      }>;
    }>,
    options?: {
      qris_reference?: string | null;
      notes?: string | null;
    }
  ): Sale {
    const db = this.getDb();

    // Idempotency check
    const existing = db.sales.find((s) => s.idempotency_key === idempotencyKey);
    if (existing) return existing;

    // Aggregate required ingredients
    const requiredIngredients: Record<string, number> = {};
    for (const item of items) {
      const recipes = db.variant_recipe_items.filter((r) => r.variant_id === item.variant_id);
      if (recipes.length === 0) {
        throw new Error(
          `Resep untuk ${item.product_name} (${item.variant_name}) belum lengkap. Admin harus mengisi resep terlebih dahulu.`
        );
      }
      for (const r of recipes) {
        requiredIngredients[r.ingredient_id] =
          (requiredIngredients[r.ingredient_id] || 0) + r.quantity_base_per_serving * item.quantity;
      }
    }

    // Check stock availability
    for (const [ingId, reqQty] of Object.entries(requiredIngredients)) {
      const ing = db.ingredients.find((i) => i.id === ingId);
      if (!ing || ing.stock_base < reqQty) {
        throw new Error(
          `Stok bahan "${ing?.name || ingId}" tidak mencukupi (Tersedia: ${ing?.stock_base || 0}, Dibutuhkan: ${reqQty}).`
        );
      }
    }

    // Deduct stock & calculate total COGS
    let totalCogs = 0;
    const saleId = `sale_${Date.now()}`;

    for (const [ingId, reqQty] of Object.entries(requiredIngredients)) {
      const ing = db.ingredients.find((i) => i.id === ingId)!;
      ing.stock_base -= reqQty;
      ing.updated_at = new Date().toISOString();

      const lineCogs = Math.round(reqQty * ing.average_cost_per_base);
      totalCogs += lineCogs;

      db.inventory_movements.push({
        id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        ingredient_id: ingId,
        movement_type: 'sale',
        quantity_delta_base: -reqQty,
        unit_cost_snapshot: ing.average_cost_per_base,
        reference_type: 'sale',
        reference_id: saleId,
        reason: `Penjualan #${receiptNumber}`,
        created_by: cashierId,
        created_at: new Date().toISOString(),
        ingredient: ing,
      });
    }

    const cashier = db.profiles.find((p) => p.id === cashierId);

    const newSale: Sale = {
      id: saleId,
      receipt_number: receiptNumber,
      cashier_id: cashierId,
      status: 'completed',
      payment_method: paymentMethod,
      subtotal_idr: subtotalIdr,
      discount_idr: discountIdr,
      total_idr: totalIdr,
      cash_received_idr: cashReceivedIdr,
      change_due_idr: changeDueIdr,
      total_cogs_idr: totalCogs,
      idempotency_key: idempotencyKey,
      qris_reference: options?.qris_reference || null,
      notes: options?.notes || null,
      void_reason: null,
      void_by: null,
      void_at: null,
      created_at: new Date().toISOString(),
      cashier,
      items: items.map((it) => ({
        id: `si_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sale_id: saleId,
        variant_id: it.variant_id,
        product_name_snapshot: it.product_name,
        variant_name_snapshot: it.variant_name,
        unit_price_idr: it.unit_price_idr,
        quantity: it.quantity,
        line_total_idr: it.line_total_idr,
        unit_cogs_idr: 0,
        line_cogs_idr: 0,
        created_at: new Date().toISOString(),
        addons: (it.addons || []).map((a) => ({
          id: `sia_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          sale_item_id: '',
          addon_id: a.addon_id,
          addon_name_snapshot: a.addon_name,
          unit_price_idr: a.unit_price_idr,
          quantity: a.quantity,
          line_total_idr: a.unit_price_idr * a.quantity,
          unit_cogs_idr: 0,
          line_cogs_idr: 0,
          created_at: new Date().toISOString(),
        })),
      })),
    };

    db.sales.push(newSale);
    this.saveDb(db);
    return newSale;
  }

  public voidSale(saleId: string, adminId: string, reason: string): void {
    const db = this.getDb();
    const sale = db.sales.find((s) => s.id === saleId);
    if (!sale) throw new Error('Transaksi tidak ditemukan.');
    if (sale.status === 'void') return; // idempotent

    sale.status = 'void';
    sale.void_reason = reason;
    sale.void_by = adminId;
    sale.void_at = new Date().toISOString();

    // Reverse inventory movements
    const originalMovements = db.inventory_movements.filter(
      (m) => m.reference_type === 'sale' && m.reference_id === saleId && m.movement_type === 'sale'
    );

    for (const mov of originalMovements) {
      const ing = db.ingredients.find((i) => i.id === mov.ingredient_id);
      if (ing) {
        ing.stock_base += Math.abs(mov.quantity_delta_base);
        ing.updated_at = new Date().toISOString();

        db.inventory_movements.push({
          id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          ingredient_id: mov.ingredient_id,
          movement_type: 'void_reversal',
          quantity_delta_base: Math.abs(mov.quantity_delta_base),
          unit_cost_snapshot: mov.unit_cost_snapshot,
          reference_type: 'sale',
          reference_id: saleId,
          reason: `Void Transaksi #${sale.receipt_number}: ${reason}`,
          created_by: adminId,
          created_at: new Date().toISOString(),
          ingredient: ing,
        });
      }
    }

    db.audit_logs.push({
      id: `log_${Date.now()}`,
      actor_id: adminId,
      action: 'VOID_SALE',
      entity_type: 'sale',
      entity_id: saleId,
      before_data: { status: 'completed', total_idr: sale.total_idr },
      after_data: { status: 'void', void_reason: reason },
      reason,
      created_at: new Date().toISOString(),
    });

    this.saveDb(db);
  }

  // ---------------- EXPENSES ----------------
  public recordExpense(data: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'status' | 'void_reason' | 'void_by' | 'void_at'>): Expense {
    const db = this.getDb();
    const newExp: Expense = {
      ...data,
      id: `exp_${Date.now()}`,
      status: 'active',
      void_reason: null,
      void_by: null,
      void_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator: db.profiles.find((p) => p.id === data.created_by),
    };
    db.expenses.push(newExp);
    this.saveDb(db);
    return newExp;
  }

  public voidExpense(expenseId: string, adminId: string, reason: string): void {
    const db = this.getDb();
    const exp = db.expenses.find((e) => e.id === expenseId);
    if (!exp) throw new Error('Pengeluaran tidak ditemukan.');

    exp.status = 'void';
    exp.void_reason = reason;
    exp.void_by = adminId;
    exp.void_at = new Date().toISOString();

    db.audit_logs.push({
      id: `log_${Date.now()}`,
      actor_id: adminId,
      action: 'VOID_EXPENSE',
      entity_type: 'expense',
      entity_id: expenseId,
      before_data: { status: 'active', amount: exp.amount_idr },
      after_data: { status: 'void', reason },
      reason,
      created_at: new Date().toISOString(),
    });

    this.saveDb(db);
  }

  // ---------------- USER MANAGEMENT ----------------
  public createUser(
    fullName: string,
    emailOrUsername: string,
    pass: string,
    role: 'admin' | 'cashier',
    customUsername?: string
  ): Profile {
    const db = this.getDb();
    const cleanInput = emailOrUsername.toLowerCase().trim();
    const isEmail = cleanInput.includes('@');

    const email = isEmail ? cleanInput : `${cleanInput}@magi.com`;
    const username = (customUsername || (isEmail ? cleanInput.split('@')[0] : cleanInput))
      .toLowerCase()
      .trim();

    if (db.profiles.some((p) => p.email?.toLowerCase() === email)) {
      throw new Error(`Email "${email}" sudah terdaftar di sistem.`);
    }

    if (db.profiles.some((p) => p.username?.toLowerCase() === username)) {
      throw new Error(`Username "${username}" sudah digunakan.`);
    }

    const newProfile: Profile = {
      id: `usr_${Date.now()}`,
      username,
      email,
      full_name: fullName.trim(),
      role,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.profiles.push(newProfile);
    db.credentials[username] = pass;
    db.credentials[email] = pass;
    this.saveDb(db);
    return newProfile;
  }

  public toggleUserActive(userId: string): boolean {
    const db = this.getDb();
    const p = db.profiles.find((u) => u.id === userId);
    if (!p) throw new Error('Pengguna tidak ditemukan.');
    p.is_active = !p.is_active;
    p.updated_at = new Date().toISOString();
    this.saveDb(db);
    return p.is_active;
  }

  // ---------------- SETTINGS ----------------
  public updateSettings(data: Partial<BusinessSettings>): BusinessSettings {
    const db = this.getDb();
    db.business_settings = {
      ...db.business_settings,
      ...data,
      updated_at: new Date().toISOString(),
    };
    this.saveDb(db);
    return db.business_settings;
  }
}

export const localDb = new LocalStoreManager();
