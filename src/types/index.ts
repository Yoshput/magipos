export type UserRole = 'admin' | 'cashier';

export interface Profile {
  id: string;
  email: string | null;
  username?: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  image_path: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  volume_ml: number;
  price_idr: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  recipe_items?: VariantRecipeItem[];
  product?: Product;
}

export interface Addon {
  id: string;
  name: string;
  price_idr: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  recipe_items?: AddonRecipeItem[];
}

export type BaseUnit = 'g' | 'ml' | 'pcs';

export interface Ingredient {
  id: string;
  name: string;
  base_unit: BaseUnit;
  purchase_unit: string;
  conversion_to_base: number;
  stock_base: number;
  minimum_stock_base: number;
  average_cost_per_base: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VariantRecipeItem {
  id: string;
  variant_id: string;
  ingredient_id: string;
  quantity_base_per_serving: number;
  created_at: string;
  ingredient?: Ingredient;
}

export interface AddonRecipeItem {
  id: string;
  addon_id: string;
  ingredient_id: string;
  quantity_base_per_addon: number;
  created_at: string;
  ingredient?: Ingredient;
}

export type PaymentMethod = 'cash' | 'qris' | 'transfer';
export type SaleStatus = 'completed' | 'void';

export interface Sale {
  id: string;
  receipt_number: string;
  cashier_id: string;
  status: SaleStatus;
  payment_method: PaymentMethod;
  subtotal_idr: number;
  discount_idr: number;
  total_idr: number;
  cash_received_idr: number | null;
  change_due_idr: number | null;
  total_cogs_idr: number;
  idempotency_key: string;
  qris_reference?: string | null;
  notes?: string | null;
  void_reason: string | null;
  void_by: string | null;
  void_at: string | null;
  created_at: string;
  cashier?: Profile;
  void_user?: Profile;
  items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  variant_id: string | null;
  product_name_snapshot: string;
  variant_name_snapshot: string;
  unit_price_idr: number;
  quantity: number;
  line_total_idr: number;
  unit_cogs_idr: number;
  line_cogs_idr: number;
  created_at: string;
  addons?: SaleItemAddon[];
}

export interface SaleItemAddon {
  id: string;
  sale_item_id: string;
  addon_id: string | null;
  addon_name_snapshot: string;
  unit_price_idr: number;
  quantity: number;
  line_total_idr: number;
  unit_cogs_idr: number;
  line_cogs_idr: number;
  created_at: string;
}

export type MovementType =
  | 'purchase'
  | 'sale'
  | 'waste'
  | 'adjustment_in'
  | 'adjustment_out'
  | 'void_reversal';

export interface InventoryMovement {
  id: string;
  ingredient_id: string;
  movement_type: MovementType;
  quantity_delta_base: number;
  unit_cost_snapshot: number;
  reference_type: string | null;
  reference_id: string | null;
  reason: string | null;
  created_by: string | null;
  created_at: string;
  ingredient?: Ingredient;
  creator?: Profile;
}

export type PurchasePaymentStatus = 'paid' | 'pending';

export interface StockPurchase {
  id: string;
  purchase_number: string;
  supplier_name: string | null;
  purchase_date: string;
  total_cost_idr: number;
  payment_status: PurchasePaymentStatus;
  notes: string | null;
  created_by: string;
  created_at: string;
  creator?: Profile;
  items?: StockPurchaseItem[];
}

export interface StockPurchaseItem {
  id: string;
  purchase_id: string;
  ingredient_id: string;
  purchase_quantity: number;
  purchase_unit_snapshot: string;
  conversion_to_base_snapshot: number;
  base_quantity: number;
  unit_cost_idr: number;
  line_total_idr: number;
  created_at: string;
  ingredient?: Ingredient;
}

export type ExpenseCategory =
  | 'transportasi'
  | 'listrik_air'
  | 'promosi'
  | 'perlengkapan_non_stok'
  | 'biaya_platform'
  | 'lainnya';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount_idr: number;
  expense_date: string;
  payment_method: PaymentMethod;
  status: 'active' | 'void';
  void_reason: string | null;
  void_by: string | null;
  void_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: Profile;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
  actor?: Profile;
}

export interface BusinessSettings {
  id: string;
  business_name: string;
  store_address: string;
  receipt_header: string;
  receipt_footer: string;
  timezone: string;
  enable_cash: boolean;
  enable_qris: boolean;
  enable_transfer: boolean;
  instagram_url: string;
  updated_at: string;
}

// Cart Item for POS
export interface CartAddon {
  addon_id: string;
  addon_name: string;
  unit_price_idr: number;
  quantity: number;
}

export interface CartItem {
  id: string; // unique identifier in cart: variantId + sorted addons
  product_id: string;
  product_name: string;
  variant_id: string;
  variant_name: string;
  unit_price_idr: number;
  quantity: number;
  addons: CartAddon[];
  has_recipe: boolean;
}
