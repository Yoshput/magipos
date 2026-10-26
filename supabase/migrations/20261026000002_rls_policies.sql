-- NyeniPOS: 002 Row Level Security (RLS) Policies
-- Enforces strict Role-Based Access Control at PostgreSQL level

-- Enable RLS on all tables
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

-- Helper security definer functions to safely verify user role without recursion
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

-- 1. PROFILES
CREATE POLICY "Profiles viewable by self or admin" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admin can update profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admin can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (public.is_admin() OR auth.uid() = id);

-- 2. PRODUCTS, VARIANTS, ADDONS
CREATE POLICY "Active users can view products" ON public.products
  FOR SELECT USING (public.is_active_user());

CREATE POLICY "Admin can manage products" ON public.products
  FOR ALL USING (public.is_admin());

CREATE POLICY "Active users can view variants" ON public.product_variants
  FOR SELECT USING (public.is_active_user());

CREATE POLICY "Admin can manage variants" ON public.product_variants
  FOR ALL USING (public.is_admin());

CREATE POLICY "Active users can view addons" ON public.addons
  FOR SELECT USING (public.is_active_user());

CREATE POLICY "Admin can manage addons" ON public.addons
  FOR ALL USING (public.is_admin());

-- 3. INGREDIENTS & RECIPES
CREATE POLICY "Active users can view ingredients" ON public.ingredients
  FOR SELECT USING (public.is_active_user());

CREATE POLICY "Admin can manage ingredients" ON public.ingredients
  FOR ALL USING (public.is_admin());

CREATE POLICY "Active users can view variant recipes" ON public.variant_recipe_items
  FOR SELECT USING (public.is_active_user());

CREATE POLICY "Admin can manage variant recipes" ON public.variant_recipe_items
  FOR ALL USING (public.is_admin());

CREATE POLICY "Active users can view addon recipes" ON public.addon_recipe_items
  FOR SELECT USING (public.is_active_user());

CREATE POLICY "Admin can manage addon recipes" ON public.addon_recipe_items
  FOR ALL USING (public.is_admin());

-- 4. SALES & ITEMS
CREATE POLICY "Users can view sales allowed by role" ON public.sales
  FOR SELECT USING (
    public.is_admin() OR (public.is_active_user() AND cashier_id = auth.uid())
  );

CREATE POLICY "Active users can insert sales" ON public.sales
  FOR INSERT WITH CHECK (public.is_active_user() AND cashier_id = auth.uid());

CREATE POLICY "Admin can update sales (void)" ON public.sales
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Users can view sale items" ON public.sale_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sales s
      WHERE s.id = sale_items.sale_id
      AND (public.is_admin() OR (public.is_active_user() AND s.cashier_id = auth.uid()))
    )
  );

CREATE POLICY "Users can view sale item addons" ON public.sale_item_addons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sale_items si
      JOIN public.sales s ON s.id = si.sale_id
      WHERE si.id = sale_item_addons.sale_item_id
      AND (public.is_admin() OR (public.is_active_user() AND s.cashier_id = auth.uid()))
    )
  );

-- 5. INVENTORY MOVEMENTS (Append-only)
CREATE POLICY "Active users can view movements" ON public.inventory_movements
  FOR SELECT USING (public.is_active_user());

CREATE POLICY "Users can insert movements" ON public.inventory_movements
  FOR INSERT WITH CHECK (public.is_active_user());

-- No update/delete policies on inventory_movements (enforces append-only!)

-- 6. STOCK PURCHASES & ITEMS (Admin only)
CREATE POLICY "Admin can manage stock purchases" ON public.stock_purchases
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admin can manage stock purchase items" ON public.stock_purchase_items
  FOR ALL USING (public.is_admin());

-- 7. EXPENSES (Admin only)
CREATE POLICY "Admin can manage expenses" ON public.expenses
  FOR ALL USING (public.is_admin());

-- 8. AUDIT LOGS (Admin only to read, authenticated can insert)
CREATE POLICY "Admin can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (public.is_active_user());

-- 9. BUSINESS SETTINGS
CREATE POLICY "Active users can view business settings" ON public.business_settings
  FOR SELECT USING (public.is_active_user());

CREATE POLICY "Admin can update business settings" ON public.business_settings
  FOR UPDATE USING (public.is_admin());
