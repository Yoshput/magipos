-- =====================================================================
-- NyeniPOS: Full Database Schema, RLS, Functions & Seed for Supabase
-- Run this script in the Supabase SQL Editor to initialize the database
-- =====================================================================

-- -------------------------------------------------------------
-- 1. TABLES & CONSTRAINTS
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT,
  full_name TEXT NOT NULL DEFAULT 'Pengguna',
  role TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('admin', 'cashier')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure columns exist even if profiles table was already created by Supabase templates
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('admin', 'cashier'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT NOT NULL DEFAULT 'Pengguna';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN username TEXT;
  END IF;
END $$;

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

CREATE TABLE IF NOT EXISTS public.addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price_idr INTEGER NOT NULL CHECK (price_idr >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

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

CREATE TABLE IF NOT EXISTS public.variant_recipe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity_base_per_serving NUMERIC(12, 4) NOT NULL CHECK (quantity_base_per_serving > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(variant_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS public.addon_recipe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  addon_id UUID NOT NULL REFERENCES public.addons(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity_base_per_addon NUMERIC(12, 4) NOT NULL CHECK (quantity_base_per_addon > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(addon_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT NOT NULL UNIQUE,
  cashier_id UUID NOT NULL REFERENCES public.profiles(id),
  customer_name TEXT DEFAULT 'Pelanggan',
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

-- -------------------------------------------------------------
-- 2. ROW LEVEL SECURITY POLICIES
-- -------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addon_recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_item_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active = true LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_active = true
  );
$$;

DROP POLICY IF EXISTS "Profiles viewable by self or admin" ON public.profiles;
CREATE POLICY "Profiles viewable by self or admin" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Admin can update profiles" ON public.profiles;
CREATE POLICY "Admin can update profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can insert profiles" ON public.profiles;
CREATE POLICY "Admin can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (public.is_admin() OR auth.uid() = id);

DROP POLICY IF EXISTS "Active users can view products" ON public.products;
CREATE POLICY "Active users can view products" ON public.products
  FOR SELECT USING (public.is_active_user());

DROP POLICY IF EXISTS "Admin can manage products" ON public.products;
CREATE POLICY "Admin can manage products" ON public.products
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Active users can view variants" ON public.product_variants;
CREATE POLICY "Active users can view variants" ON public.product_variants
  FOR SELECT USING (public.is_active_user());

DROP POLICY IF EXISTS "Admin can manage variants" ON public.product_variants;
CREATE POLICY "Admin can manage variants" ON public.product_variants
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Active users can view addons" ON public.addons;
CREATE POLICY "Active users can view addons" ON public.addons
  FOR SELECT USING (public.is_active_user());

DROP POLICY IF EXISTS "Admin can manage addons" ON public.addons;
CREATE POLICY "Admin can manage addons" ON public.addons
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Active users can view ingredients" ON public.ingredients;
CREATE POLICY "Active users can view ingredients" ON public.ingredients
  FOR SELECT USING (public.is_active_user());

DROP POLICY IF EXISTS "Admin can manage ingredients" ON public.ingredients;
CREATE POLICY "Admin can manage ingredients" ON public.ingredients
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Active users can view variant recipes" ON public.variant_recipe_items;
CREATE POLICY "Active users can view variant recipes" ON public.variant_recipe_items
  FOR SELECT USING (public.is_active_user());

DROP POLICY IF EXISTS "Admin can manage variant recipes" ON public.variant_recipe_items;
CREATE POLICY "Admin can manage variant recipes" ON public.variant_recipe_items
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Active users can view addon recipes" ON public.addon_recipe_items;
CREATE POLICY "Active users can view addon recipes" ON public.addon_recipe_items
  FOR SELECT USING (public.is_active_user());

DROP POLICY IF EXISTS "Admin can manage addon recipes" ON public.addon_recipe_items;
CREATE POLICY "Admin can manage addon recipes" ON public.addon_recipe_items
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Users can view sales allowed by role" ON public.sales;
CREATE POLICY "Users can view sales allowed by role" ON public.sales
  FOR SELECT USING (
    public.is_admin() OR (public.is_active_user() AND cashier_id = auth.uid())
  );

DROP POLICY IF EXISTS "Active users can insert sales" ON public.sales;
CREATE POLICY "Active users can insert sales" ON public.sales
  FOR INSERT WITH CHECK (public.is_active_user() AND cashier_id = auth.uid());

DROP POLICY IF EXISTS "Admin can update sales (void)" ON public.sales;
CREATE POLICY "Admin can update sales (void)" ON public.sales
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Users can view sale items" ON public.sale_items;
CREATE POLICY "Users can view sale items" ON public.sale_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sales s
      WHERE s.id = sale_items.sale_id
      AND (public.is_admin() OR (public.is_active_user() AND s.cashier_id = auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can view sale item addons" ON public.sale_item_addons;
CREATE POLICY "Users can view sale item addons" ON public.sale_item_addons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sale_items si
      JOIN public.sales s ON s.id = si.sale_id
      WHERE si.id = sale_item_addons.sale_item_id
      AND (public.is_admin() OR (public.is_active_user() AND s.cashier_id = auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Active users can view movements" ON public.inventory_movements;
CREATE POLICY "Active users can view movements" ON public.inventory_movements
  FOR SELECT USING (public.is_active_user());

DROP POLICY IF EXISTS "Users can insert movements" ON public.inventory_movements;
CREATE POLICY "Users can insert movements" ON public.inventory_movements
  FOR INSERT WITH CHECK (public.is_active_user());

DROP POLICY IF EXISTS "Admin can manage stock purchases" ON public.stock_purchases;
CREATE POLICY "Admin can manage stock purchases" ON public.stock_purchases
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can manage stock purchase items" ON public.stock_purchase_items;
CREATE POLICY "Admin can manage stock purchase items" ON public.stock_purchase_items
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can manage expenses" ON public.expenses;
CREATE POLICY "Admin can manage expenses" ON public.expenses
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can view audit logs" ON public.audit_logs;
CREATE POLICY "Admin can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (public.is_active_user());

DROP POLICY IF EXISTS "Active users can view business settings" ON public.business_settings;
CREATE POLICY "Active users can view business settings" ON public.business_settings
  FOR SELECT USING (public.is_active_user());

DROP POLICY IF EXISTS "Admin can update business settings" ON public.business_settings;
CREATE POLICY "Admin can update business settings" ON public.business_settings
  FOR UPDATE USING (public.is_admin());

-- -------------------------------------------------------------
-- 3. ATOMIC FUNCTIONS AND RPCS
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_sale_atomic(
  p_receipt_number TEXT,
  p_cashier_id UUID,
  p_payment_method TEXT,
  p_subtotal_idr INTEGER,
  p_discount_idr INTEGER,
  p_total_idr INTEGER,
  p_cash_received_idr INTEGER,
  p_change_due_idr INTEGER,
  p_idempotency_key TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_sale_id UUID;
  v_new_sale_id UUID;
  v_item RECORD;
  v_addon RECORD;
  v_req_item RECORD;
  v_ing RECORD;
  v_total_cogs INTEGER := 0;
  v_sale_item_id UUID;
  v_line_cogs INTEGER;
  v_unit_cogs INTEGER;
  v_addon_cogs INTEGER;
  v_is_active BOOLEAN;
  v_user_role TEXT;
BEGIN
  SELECT is_active, role INTO v_is_active, v_user_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_is_active IS NOT TRUE THEN
    RAISE EXCEPTION 'Akses ditolak: Pengguna tidak aktif atau tidak ditemukan.';
  END IF;

  IF auth.uid() <> p_cashier_id AND v_user_role <> 'admin' THEN
    RAISE EXCEPTION 'Akses ditolak: Kasir ID tidak sesuai dengan sesi pengguna.';
  END IF;

  SELECT id INTO v_existing_sale_id
  FROM public.sales
  WHERE idempotency_key = p_idempotency_key;

  IF v_existing_sale_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'already_processed',
      'sale_id', v_existing_sale_id,
      'receipt_number', p_receipt_number,
      'message', 'Transaksi sudah diproses sebelumnya.'
    );
  END IF;

  IF p_payment_method = 'cash' THEN
    IF p_cash_received_idr IS NULL OR p_cash_received_idr < p_total_idr THEN
      RAISE EXCEPTION 'Nominal uang tunai diterima kurang dari total belanja.';
    END IF;
  END IF;

  CREATE TEMP TABLE temp_required_ingredients (
    ingredient_id UUID PRIMARY KEY,
    required_qty NUMERIC(14, 4),
    ingredient_name TEXT,
    current_stock NUMERIC(14, 4),
    cost_per_base NUMERIC(14, 4)
  ) ON COMMIT DROP;

  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    variant_id UUID,
    product_name TEXT,
    variant_name TEXT,
    unit_price_idr INTEGER,
    quantity INTEGER,
    line_total_idr INTEGER,
    addons JSONB
  ) LOOP
    IF NOT EXISTS (SELECT 1 FROM public.variant_recipe_items WHERE variant_id = v_item.variant_id) THEN
      RAISE EXCEPTION 'Resep untuk % - % belum lengkap. Admin harus mengatur resep terlebih dahulu.', v_item.product_name, v_item.variant_name;
    END IF;

    FOR v_req_item IN 
      SELECT vri.ingredient_id, (vri.quantity_base_per_serving * v_item.quantity) AS qty, ing.name, ing.stock_base, ing.average_cost_per_base
      FROM public.variant_recipe_items vri
      JOIN public.ingredients ing ON ing.id = vri.ingredient_id
      WHERE vri.variant_id = v_item.variant_id
    LOOP
      INSERT INTO temp_required_ingredients (ingredient_id, required_qty, ingredient_name, current_stock, cost_per_base)
      VALUES (v_req_item.ingredient_id, v_req_item.qty, v_req_item.name, v_req_item.stock_base, v_req_item.average_cost_per_base)
      ON CONFLICT (ingredient_id)
      DO UPDATE SET required_qty = temp_required_ingredients.required_qty + EXCLUDED.required_qty;
    END LOOP;

    IF v_item.addons IS NOT NULL AND jsonb_array_length(v_item.addons) > 0 THEN
      FOR v_addon IN SELECT * FROM jsonb_to_recordset(v_item.addons) AS a(
        addon_id UUID,
        addon_name TEXT,
        unit_price_idr INTEGER,
        quantity INTEGER
      ) LOOP
        FOR v_req_item IN
          SELECT ari.ingredient_id, (ari.quantity_base_per_addon * v_addon.quantity * v_item.quantity) AS qty, ing.name, ing.stock_base, ing.average_cost_per_base
          FROM public.addon_recipe_items ari
          JOIN public.ingredients ing ON ing.id = ari.ingredient_id
          WHERE ari.addon_id = v_addon.addon_id
        LOOP
          INSERT INTO temp_required_ingredients (ingredient_id, required_qty, ingredient_name, current_stock, cost_per_base)
          VALUES (v_req_item.ingredient_id, v_req_item.qty, v_req_item.name, v_req_item.stock_base, v_req_item.average_cost_per_base)
          ON CONFLICT (ingredient_id)
          DO UPDATE SET required_qty = temp_required_ingredients.required_qty + EXCLUDED.required_qty;
        END LOOP;
      END LOOP;
    END IF;
  END LOOP;

  FOR v_ing IN SELECT * FROM temp_required_ingredients LOOP
    IF v_ing.current_stock < v_ing.required_qty THEN
      RAISE EXCEPTION 'Stok bahan "%" tidak mencukupi. Tersedia: %, Dibutuhkan: %', 
        v_ing.ingredient_name, v_ing.current_stock, v_ing.required_qty;
    END IF;
  END LOOP;

  SELECT COALESCE(SUM(ROUND(required_qty * cost_per_base)), 0)::INTEGER
  INTO v_total_cogs
  FROM temp_required_ingredients;

  INSERT INTO public.sales (
    receipt_number,
    cashier_id,
    status,
    payment_method,
    subtotal_idr,
    discount_idr,
    total_idr,
    cash_received_idr,
    change_due_idr,
    total_cogs_idr,
    idempotency_key
  ) VALUES (
    p_receipt_number,
    p_cashier_id,
    'completed',
    p_payment_method,
    p_subtotal_idr,
    p_discount_idr,
    p_total_idr,
    p_cash_received_idr,
    p_change_due_idr,
    v_total_cogs,
    p_idempotency_key
  ) RETURNING id INTO v_new_sale_id;

  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    variant_id UUID,
    product_name TEXT,
    variant_name TEXT,
    unit_price_idr INTEGER,
    quantity INTEGER,
    line_total_idr INTEGER,
    addons JSONB
  ) LOOP
    SELECT COALESCE(SUM(ROUND(vri.quantity_base_per_serving * ing.average_cost_per_base)), 0)::INTEGER
    INTO v_unit_cogs
    FROM public.variant_recipe_items vri
    JOIN public.ingredients ing ON ing.id = vri.ingredient_id
    WHERE vri.variant_id = v_item.variant_id;

    v_line_cogs := v_unit_cogs * v_item.quantity;

    INSERT INTO public.sale_items (
      sale_id,
      variant_id,
      product_name_snapshot,
      variant_name_snapshot,
      unit_price_idr,
      quantity,
      line_total_idr,
      unit_cogs_idr,
      line_cogs_idr
    ) VALUES (
      v_new_sale_id,
      v_item.variant_id,
      v_item.product_name,
      v_item.variant_name,
      v_item.unit_price_idr,
      v_item.quantity,
      v_item.line_total_idr,
      v_unit_cogs,
      v_line_cogs
    ) RETURNING id INTO v_sale_item_id;

    IF v_item.addons IS NOT NULL AND jsonb_array_length(v_item.addons) > 0 THEN
      FOR v_addon IN SELECT * FROM jsonb_to_recordset(v_item.addons) AS a(
        addon_id UUID,
        addon_name TEXT,
        unit_price_idr INTEGER,
        quantity INTEGER
      ) LOOP
        SELECT COALESCE(SUM(ROUND(ari.quantity_base_per_addon * ing.average_cost_per_base)), 0)::INTEGER
        INTO v_addon_cogs
        FROM public.addon_recipe_items ari
        JOIN public.ingredients ing ON ing.id = ari.ingredient_id
        WHERE ari.addon_id = v_addon.addon_id;

        INSERT INTO public.sale_item_addons (
          sale_item_id,
          addon_id,
          addon_name_snapshot,
          unit_price_idr,
          quantity,
          line_total_idr,
          unit_cogs_idr,
          line_cogs_idr
        ) VALUES (
          v_sale_item_id,
          v_addon.addon_id,
          v_addon.addon_name,
          v_addon.unit_price_idr,
          v_addon.quantity,
          (v_addon.unit_price_idr * v_addon.quantity * v_item.quantity),
          v_addon_cogs,
          (v_addon_cogs * v_addon.quantity * v_item.quantity)
        );
      END LOOP;
    END IF;
  END LOOP;

  FOR v_ing IN SELECT * FROM temp_required_ingredients LOOP
    UPDATE public.ingredients
    SET stock_base = stock_base - v_ing.required_qty,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_ing.ingredient_id;

    INSERT INTO public.inventory_movements (
      ingredient_id,
      movement_type,
      quantity_delta_base,
      unit_cost_snapshot,
      reference_type,
      reference_id,
      reason,
      created_by
    ) VALUES (
      v_ing.ingredient_id,
      'sale',
      -v_ing.required_qty,
      v_ing.cost_per_base,
      'sale',
      v_new_sale_id,
      'Penjualan #' || p_receipt_number,
      p_cashier_id
    );
  END LOOP;

  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    after_data,
    reason
  ) VALUES (
    p_cashier_id,
    'CREATE_SALE',
    'sale',
    v_new_sale_id::text,
    jsonb_build_object(
      'receipt_number', p_receipt_number,
      'total_idr', p_total_idr,
      'payment_method', p_payment_method
    ),
    'Transaksi kasir'
  );

  RETURN jsonb_build_object(
    'status', 'success',
    'sale_id', v_new_sale_id,
    'receipt_number', p_receipt_number,
    'total_cogs_idr', v_total_cogs
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.void_sale_atomic(
  p_sale_id UUID,
  p_admin_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale RECORD;
  v_movement RECORD;
  v_is_admin BOOLEAN;
BEGIN
  SELECT (role = 'admin' AND is_active = true) INTO v_is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya Admin aktif yang dapat membatalkan (void) transaksi.';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Alasan void transaksi wajib diisi.';
  END IF;

  SELECT * INTO v_sale
  FROM public.sales
  WHERE id = p_sale_id;

  IF v_sale.id IS NULL THEN
    RAISE EXCEPTION 'Transaksi tidak ditemukan.';
  END IF;

  IF v_sale.status = 'void' THEN
    RETURN jsonb_build_object(
      'status', 'already_voided',
      'message', 'Transaksi sudah dibatalkan sebelumnya.'
    );
  END IF;

  UPDATE public.sales
  SET status = 'void',
      void_reason = p_reason,
      void_by = auth.uid(),
      void_at = timezone('utc'::text, now())
  WHERE id = p_sale_id;

  FOR v_movement IN
    SELECT ingredient_id, quantity_delta_base, unit_cost_snapshot
    FROM public.inventory_movements
    WHERE reference_type = 'sale' AND reference_id = p_sale_id AND movement_type = 'sale'
  LOOP
    UPDATE public.ingredients
    SET stock_base = stock_base + ABS(v_movement.quantity_delta_base),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_movement.ingredient_id;

    INSERT INTO public.inventory_movements (
      ingredient_id,
      movement_type,
      quantity_delta_base,
      unit_cost_snapshot,
      reference_type,
      reference_id,
      reason,
      created_by
    ) VALUES (
      v_movement.ingredient_id,
      'void_reversal',
      ABS(v_movement.quantity_delta_base),
      v_movement.unit_cost_snapshot,
      'sale',
      p_sale_id,
      'Void Transaksi #' || v_sale.receipt_number || ': ' || p_reason,
      auth.uid()
    );
  END LOOP;

  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    before_data,
    after_data,
    reason
  ) VALUES (
    auth.uid(),
    'VOID_SALE',
    'sale',
    p_sale_id::text,
    jsonb_build_object('status', 'completed', 'total_idr', v_sale.total_idr),
    jsonb_build_object('status', 'void', 'void_reason', p_reason),
    p_reason
  );

  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Transaksi berhasil dibatalkan dan stok dikembalikan.'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_stock_purchase_atomic(
  p_purchase_number TEXT,
  p_supplier_name TEXT,
  p_purchase_date DATE,
  p_total_cost_idr INTEGER,
  p_payment_status TEXT,
  p_notes TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_new_purchase_id UUID;
  v_item RECORD;
  v_ing RECORD;
  v_base_qty NUMERIC(14, 4);
  v_cost_per_base NUMERIC(14, 4);
  v_new_avg_cost NUMERIC(14, 4);
  v_new_total_stock NUMERIC(14, 4);
BEGIN
  SELECT (role = 'admin' AND is_active = true) INTO v_is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya Admin aktif yang dapat mencatat pembelian bahan.';
  END IF;

  INSERT INTO public.stock_purchases (
    purchase_number,
    supplier_name,
    purchase_date,
    total_cost_idr,
    payment_status,
    notes,
    created_by
  ) VALUES (
    p_purchase_number,
    p_supplier_name,
    p_purchase_date,
    p_total_cost_idr,
    p_payment_status,
    p_notes,
    auth.uid()
  ) RETURNING id INTO v_new_purchase_id;

  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    ingredient_id UUID,
    purchase_quantity NUMERIC(12, 4),
    purchase_unit TEXT,
    conversion_to_base NUMERIC(12, 4),
    unit_cost_idr INTEGER,
    line_total_idr INTEGER
  ) LOOP
    v_base_qty := v_item.purchase_quantity * v_item.conversion_to_base;
    v_cost_per_base := v_item.unit_cost_idr / v_item.conversion_to_base;

    INSERT INTO public.stock_purchase_items (
      purchase_id,
      ingredient_id,
      purchase_quantity,
      purchase_unit_snapshot,
      conversion_to_base_snapshot,
      base_quantity,
      unit_cost_idr,
      line_total_idr
    ) VALUES (
      v_new_purchase_id,
      v_item.ingredient_id,
      v_item.purchase_quantity,
      v_item.purchase_unit,
      v_item.conversion_to_base,
      v_base_qty,
      v_item.unit_cost_idr,
      v_item.line_total_idr
    );

    SELECT stock_base, average_cost_per_base INTO v_ing
    FROM public.ingredients
    WHERE id = v_item.ingredient_id;

    v_new_total_stock := v_ing.stock_base + v_base_qty;

    IF v_new_total_stock > 0 THEN
      v_new_avg_cost := ((v_ing.stock_base * v_ing.average_cost_per_base) + (v_base_qty * v_cost_per_base)) / v_new_total_stock;
    ELSE
      v_new_avg_cost := v_cost_per_base;
    END IF;

    UPDATE public.ingredients
    SET stock_base = v_new_total_stock,
        average_cost_per_base = ROUND(v_new_avg_cost, 4),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_item.ingredient_id;

    INSERT INTO public.inventory_movements (
      ingredient_id,
      movement_type,
      quantity_delta_base,
      unit_cost_snapshot,
      reference_type,
      reference_id,
      reason,
      created_by
    ) VALUES (
      v_item.ingredient_id,
      'purchase',
      v_base_qty,
      v_cost_per_base,
      'purchase',
      v_new_purchase_id,
      'Restock #' || p_purchase_number || ' (' || COALESCE(p_supplier_name, 'Umum') || ')',
      auth.uid()
    );
  END LOOP;

  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    after_data,
    reason
  ) VALUES (
    auth.uid(),
    'RECORD_PURCHASE',
    'stock_purchase',
    v_new_purchase_id::text,
    jsonb_build_object(
      'purchase_number', p_purchase_number,
      'total_cost_idr', p_total_cost_idr
    ),
    'Penerimaan stok bahan'
  );

  RETURN jsonb_build_object(
    'status', 'success',
    'purchase_id', v_new_purchase_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_inventory_adjustment_atomic(
  p_ingredient_id UUID,
  p_type TEXT,
  p_quantity_delta_base NUMERIC(14, 4),
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_ing RECORD;
  v_new_stock NUMERIC(14, 4);
BEGIN
  SELECT (role = 'admin' AND is_active = true) INTO v_is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya Admin aktif yang dapat mengubah stok atau mencatat waste.';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Alasan penyesuaian/waste stok wajib diisi.';
  END IF;

  IF p_type NOT IN ('waste', 'adjustment_in', 'adjustment_out') THEN
    RAISE EXCEPTION 'Tipe mutasi tidak valid.';
  END IF;

  SELECT * INTO v_ing
  FROM public.ingredients
  WHERE id = p_ingredient_id;

  IF v_ing.id IS NULL THEN
    RAISE EXCEPTION 'Bahan tidak ditemukan.';
  END IF;

  v_new_stock := v_ing.stock_base + p_quantity_delta_base;

  IF v_new_stock < 0 THEN
    RAISE EXCEPTION 'Pengurangan stok melebihi stok yang tersedia saat ini (Stok: %, Pengurangan: %)', v_ing.stock_base, ABS(p_quantity_delta_base);
  END IF;

  UPDATE public.ingredients
  SET stock_base = v_new_stock,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_ingredient_id;

  INSERT INTO public.inventory_movements (
    ingredient_id,
    movement_type,
    quantity_delta_base,
    unit_cost_snapshot,
    reference_type,
    reason,
    created_by
  ) VALUES (
    p_ingredient_id,
    p_type,
    p_quantity_delta_base,
    v_ing.average_cost_per_base,
    'manual',
    p_reason,
    auth.uid()
  );

  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    before_data,
    after_data,
    reason
  ) VALUES (
    auth.uid(),
    'INVENTORY_ADJUSTMENT',
    'ingredient',
    p_ingredient_id::text,
    jsonb_build_object('old_stock', v_ing.stock_base),
    jsonb_build_object('new_stock', v_new_stock, 'type', p_type, 'delta', p_quantity_delta_base),
    p_reason
  );

  RETURN jsonb_build_object(
    'status', 'success',
    'new_stock', v_new_stock
  );
END;
$$;

-- -------------------------------------------------------------
-- 4. SEED INITIAL PRODUCTS, VARIANTS, ADDONS & SETTINGS
-- -------------------------------------------------------------

INSERT INTO public.products (id, name, description, category, image_path, sort_order)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Dragon Sago', 'Dessert cup segar dengan perpaduan buah naga merah pilihan, sagu mutiara, dan saus creamy spesial Mango Nyeni.', 'Dessert Cup', '/assets/mango-sago-only.png', 1),
  ('22222222-2222-2222-2222-222222222222', 'Mango Sago', 'Dessert cup signature dengan mangga harum manis legit berlimpah, jelly mangga, dan kuah susu kental manis gurih.', 'Dessert Cup', '/assets/mango-sago-splash-stack.png', 2),
  ('33333333-3333-3333-3333-333333333333', 'Strawberry Sago', 'Dessert cup sensasi asam manis stroberi segar dengan sagu mutiara kenyal dan racikan susu premium.', 'Dessert Cup', '/assets/mango-sago-only.png', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.product_variants (id, product_id, name, volume_ml, price_idr)
VALUES
  ('11111111-0001-0000-0000-000000000200', '11111111-1111-1111-1111-111111111111', '200 ml', 200, 13000),
  ('11111111-0001-0000-0000-000000000300', '11111111-1111-1111-1111-111111111111', '300 ml', 300, 17000),
  ('11111111-0001-0000-0000-000000000400', '11111111-1111-1111-1111-111111111111', '400 ml', 400, 22000),
  ('11111111-0001-0000-0000-000000000500', '11111111-1111-1111-1111-111111111111', '500 ml', 500, 27000),
  ('22222222-0002-0000-0000-000000000200', '22222222-2222-2222-2222-222222222222', '200 ml', 200, 13000),
  ('22222222-0002-0000-0000-000000000300', '22222222-2222-2222-2222-222222222222', '300 ml', 300, 17000),
  ('22222222-0002-0000-0000-000000000400', '22222222-2222-2222-2222-222222222222', '400 ml', 400, 22000),
  ('22222222-0002-0000-0000-000000000500', '22222222-2222-2222-2222-222222222222', '500 ml', 500, 27000),
  ('33333333-0003-0000-0000-000000000200', '33333333-3333-3333-3333-333333333333', '200 ml', 200, 13000),
  ('33333333-0003-0000-0000-000000000300', '33333333-3333-3333-3333-333333333333', '300 ml', 300, 17000),
  ('33333333-0003-0000-0000-000000000400', '33333333-3333-3333-3333-333333333333', '400 ml', 400, 22000),
  ('33333333-0003-0000-0000-000000000500', '33333333-3333-3333-3333-333333333333', '500 ml', 500, 27000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.addons (id, name, price_idr)
VALUES ('44444444-4444-4444-4444-444444444444', 'Mix Fruit', 2000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ingredients (id, name, base_unit, purchase_unit, conversion_to_base, stock_base, minimum_stock_base, average_cost_per_base)
VALUES
  ('55555555-0001-0000-0000-000000000001', 'Mangga Harum Manis', 'g', 'kg', 1000, 10000, 2000, 35.0),
  ('55555555-0001-0000-0000-000000000002', 'Buah Naga Merah', 'g', 'kg', 1000, 8000, 1500, 25.0),
  ('55555555-0001-0000-0000-000000000003', 'Stroberi Segar', 'g', 'kg', 1000, 5000, 1000, 45.0),
  ('55555555-0001-0000-0000-000000000004', 'Sagu Mutiara', 'g', 'kg', 1000, 12000, 2000, 18.0),
  ('55555555-0001-0000-0000-000000000005', 'Susu Evaporasi & Creamer', 'ml', 'liter', 1000, 15000, 3000, 22.0),
  ('55555555-0001-0000-0000-000000000006', 'Gula & Sirup Racikan', 'ml', 'liter', 1000, 10000, 2000, 15.0),
  ('55555555-0001-0000-0000-000000000007', 'Cup + Tutup 200 ml', 'pcs', 'pack (50 pcs)', 50, 200, 50, 450.0),
  ('55555555-0001-0000-0000-000000000008', 'Cup + Tutup 300 ml', 'pcs', 'pack (50 pcs)', 50, 200, 50, 550.0),
  ('55555555-0001-0000-0000-000000000009', 'Cup + Tutup 400 ml', 'pcs', 'pack (50 pcs)', 50, 200, 50, 650.0),
  ('55555555-0001-0000-0000-000000000010', 'Cup + Tutup 500 ml', 'pcs', 'pack (50 pcs)', 50, 200, 50, 750.0),
  ('55555555-0001-0000-0000-000000000011', 'Sendok & Sedotan Higienis', 'pcs', 'pack (100 pcs)', 100, 500, 100, 120.0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.business_settings (
  id,
  business_name,
  store_address,
  receipt_header,
  receipt_footer,
  timezone,
  enable_cash,
  enable_qris,
  enable_transfer,
  instagram_url
)
VALUES (
  '99999999-9999-9999-9999-999999999999',
  'Mango Nyeni',
  'Jl. Senopati No. 42, Jakarta Selatan',
  'Sensasi Dessert Sago Asli & Creamy!',
  'Terima kasih telah menikmati Mango Nyeni! Jangan lupa tag kami di Instagram.',
  'Asia/Jakarta',
  true,
  true,
  true,
  ''
)
ON CONFLICT (id) DO NOTHING;

-- Safe column migrations for existing databases
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_name TEXT DEFAULT 'Pelanggan';
ON CONFLICT (id) DO NOTHING;
