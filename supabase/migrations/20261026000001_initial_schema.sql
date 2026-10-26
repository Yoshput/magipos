-- NyeniPOS: 001 Initial Schema
-- Mango Nyeni Operational System

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'cashier')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Dessert Cup',
  image_path TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Product variants table (200ml, 300ml, 400ml, 500ml)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  volume_ml INTEGER NOT NULL CHECK (volume_ml > 0),
  price_idr INTEGER NOT NULL CHECK (price_idr >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Addons table (e.g. Mix Fruit)
CREATE TABLE IF NOT EXISTS public.addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price_idr INTEGER NOT NULL CHECK (price_idr >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ingredients table
CREATE TABLE IF NOT EXISTS public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_unit TEXT NOT NULL CHECK (base_unit IN ('g', 'ml', 'pcs')),
  purchase_unit TEXT NOT NULL,
  conversion_to_base NUMERIC(12, 4) NOT NULL CHECK (conversion_to_base > 0),
  stock_base NUMERIC(14, 4) NOT NULL DEFAULT 0 CHECK (stock_base >= 0),
  minimum_stock_base NUMERIC(14, 4) NOT NULL DEFAULT 0 CHECK (minimum_stock_base >= 0),
  average_cost_per_base NUMERIC(14, 4) NOT NULL DEFAULT 0 CHECK (average_cost_per_base >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Variant recipe items
CREATE TABLE IF NOT EXISTS public.variant_recipe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity_base_per_serving NUMERIC(12, 4) NOT NULL CHECK (quantity_base_per_serving > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(variant_id, ingredient_id)
);

-- Addon recipe items
CREATE TABLE IF NOT EXISTS public.addon_recipe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  addon_id UUID NOT NULL REFERENCES public.addons(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity_base_per_addon NUMERIC(12, 4) NOT NULL CHECK (quantity_base_per_addon > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(addon_id, ingredient_id)
);

-- Sales table
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT NOT NULL UNIQUE,
  cashier_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'void')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'qris', 'transfer')),
  subtotal_idr INTEGER NOT NULL CHECK (subtotal_idr >= 0),
  discount_idr INTEGER NOT NULL DEFAULT 0 CHECK (discount_idr >= 0),
  total_idr INTEGER NOT NULL CHECK (total_idr >= 0),
  cash_received_idr INTEGER CHECK (cash_received_idr >= total_idr OR cash_received_idr IS NULL),
  change_due_idr INTEGER DEFAULT 0 CHECK (change_due_idr >= 0 OR change_due_idr IS NULL),
  total_cogs_idr INTEGER NOT NULL DEFAULT 0 CHECK (total_cogs_idr >= 0),
  idempotency_key TEXT NOT NULL UNIQUE,
  void_reason TEXT,
  void_by UUID REFERENCES public.profiles(id),
  void_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Sale items table (with snapshots)
CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name_snapshot TEXT NOT NULL,
  variant_name_snapshot TEXT NOT NULL,
  unit_price_idr INTEGER NOT NULL CHECK (unit_price_idr >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total_idr INTEGER NOT NULL CHECK (line_total_idr >= 0),
  unit_cogs_idr INTEGER NOT NULL DEFAULT 0 CHECK (unit_cogs_idr >= 0),
  line_cogs_idr INTEGER NOT NULL DEFAULT 0 CHECK (line_cogs_idr >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Sale item addons table
CREATE TABLE IF NOT EXISTS public.sale_item_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_item_id UUID NOT NULL REFERENCES public.sale_items(id) ON DELETE CASCADE,
  addon_id UUID REFERENCES public.addons(id) ON DELETE SET NULL,
  addon_name_snapshot TEXT NOT NULL,
  unit_price_idr INTEGER NOT NULL CHECK (unit_price_idr >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total_idr INTEGER NOT NULL CHECK (line_total_idr >= 0),
  unit_cogs_idr INTEGER NOT NULL DEFAULT 0 CHECK (unit_cogs_idr >= 0),
  line_cogs_idr INTEGER NOT NULL DEFAULT 0 CHECK (line_cogs_idr >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Inventory movements table (append-only)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'sale', 'waste', 'adjustment_in', 'adjustment_out', 'void_reversal')),
  quantity_delta_base NUMERIC(14, 4) NOT NULL,
  unit_cost_snapshot NUMERIC(14, 4) NOT NULL DEFAULT 0,
  reference_type TEXT,
  reference_id UUID,
  reason TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Stock purchases table
CREATE TABLE IF NOT EXISTS public.stock_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_number TEXT NOT NULL UNIQUE,
  supplier_name TEXT,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_cost_idr INTEGER NOT NULL CHECK (total_cost_idr >= 0),
  payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending')),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Stock purchase items table
CREATE TABLE IF NOT EXISTS public.stock_purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.stock_purchases(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  purchase_quantity NUMERIC(12, 4) NOT NULL CHECK (purchase_quantity > 0),
  purchase_unit_snapshot TEXT NOT NULL,
  conversion_to_base_snapshot NUMERIC(12, 4) NOT NULL CHECK (conversion_to_base_snapshot > 0),
  base_quantity NUMERIC(14, 4) NOT NULL CHECK (base_quantity > 0),
  unit_cost_idr INTEGER NOT NULL CHECK (unit_cost_idr >= 0),
  line_total_idr INTEGER NOT NULL CHECK (line_total_idr >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Expenses table (operational expenses)
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('transportasi', 'listrik_air', 'promosi', 'perlengkapan_non_stok', 'biaya_platform', 'lainnya')),
  description TEXT NOT NULL,
  amount_idr INTEGER NOT NULL CHECK (amount_idr > 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'transfer', 'qris')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'void')),
  void_reason TEXT,
  void_by UUID REFERENCES public.profiles(id),
  void_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  before_data JSONB,
  after_data JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Business settings table
CREATE TABLE IF NOT EXISTS public.business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL DEFAULT 'Mango Nyeni',
  store_address TEXT DEFAULT 'Jl. Raya Mangga No. 88, Jakarta',
  receipt_header TEXT DEFAULT 'Selamat Menikmati Mango Nyeni!',
  receipt_footer TEXT DEFAULT 'Terima kasih atas kunjungan Anda!',
  timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
  enable_cash BOOLEAN NOT NULL DEFAULT true,
  enable_qris BOOLEAN NOT NULL DEFAULT true,
  enable_transfer BOOLEAN NOT NULL DEFAULT true,
  instagram_url TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_active ON public.ingredients(is_active);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_cashier ON public.sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_idempotency ON public.sales(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_ingredient ON public.inventory_movements(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_ref ON public.inventory_movements(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON public.stock_purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
