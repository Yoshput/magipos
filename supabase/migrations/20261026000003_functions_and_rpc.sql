-- NyeniPOS: 003 Functions and Atomic RPCs
-- Ensures ACID transactions, atomic stock deductions, and auditability

-- 1. Atomic Sale Creation Function
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
  -- 1. Security Check: verify caller matches cashier or is admin, and is active
  SELECT is_active, role INTO v_is_active, v_user_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_is_active IS NOT TRUE THEN
    RAISE EXCEPTION 'Akses ditolak: Pengguna tidak aktif atau tidak ditemukan.';
  END IF;

  IF auth.uid() <> p_cashier_id AND v_user_role <> 'admin' THEN
    RAISE EXCEPTION 'Akses ditolak: Kasir ID tidak sesuai dengan sesi pengguna.';
  END IF;

  -- 2. Idempotency Check: if this idempotency key already processed, return existing sale
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

  -- Validate payment cash calculation
  IF p_payment_method = 'cash' THEN
    IF p_cash_received_idr IS NULL OR p_cash_received_idr < p_total_idr THEN
      RAISE EXCEPTION 'Nominal uang tunai diterima kurang dari total belanja.';
    END IF;
  END IF;

  -- 3. Pre-check recipe completeness and stock requirements across all items
  -- Create temporary table for aggregated ingredient requirements
  CREATE TEMP TABLE temp_required_ingredients (
    ingredient_id UUID PRIMARY KEY,
    required_qty NUMERIC(14, 4),
    ingredient_name TEXT,
    current_stock NUMERIC(14, 4),
    cost_per_base NUMERIC(14, 4)
  ) ON COMMIT DROP;

  -- Loop through each item in payload
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    variant_id UUID,
    product_name TEXT,
    variant_name TEXT,
    unit_price_idr INTEGER,
    quantity INTEGER,
    line_total_idr INTEGER,
    addons JSONB
  ) LOOP
    -- Check if variant has recipe configured
    IF NOT EXISTS (SELECT 1 FROM public.variant_recipe_items WHERE variant_id = v_item.variant_id) THEN
      RAISE EXCEPTION 'Resep untuk % - % belum lengkap. Admin harus mengatur resep terlebih dahulu.', v_item.product_name, v_item.variant_name;
    END IF;

    -- Aggregate variant recipe requirements
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

    -- Aggregate addon recipe requirements if any
    IF v_item.addons IS NOT NULL AND jsonb_array_length(v_item.addons) > 0 THEN
      FOR v_addon IN SELECT * FROM jsonb_to_recordset(v_item.addons) AS a(
        addon_id UUID,
        addon_name TEXT,
        unit_price_idr INTEGER,
        quantity INTEGER
      ) LOOP
        -- If addon has recipes, aggregate them
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

  -- 4. Check available stock for all aggregated ingredients
  FOR v_ing IN SELECT * FROM temp_required_ingredients LOOP
    IF v_ing.current_stock < v_ing.required_qty THEN
      RAISE EXCEPTION 'Stok bahan "%" tidak mencukupi. Tersedia: %, Dibutuhkan: %', 
        v_ing.ingredient_name, v_ing.current_stock, v_ing.required_qty;
    END IF;
  END LOOP;

  -- 5. Calculate total COGS from required ingredients snapshot
  SELECT COALESCE(SUM(ROUND(required_qty * cost_per_base)), 0)::INTEGER
  INTO v_total_cogs
  FROM temp_required_ingredients;

  -- 6. Insert Sale header
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

  -- 7. Insert Sale items & Addons with snapshots
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    variant_id UUID,
    product_name TEXT,
    variant_name TEXT,
    unit_price_idr INTEGER,
    quantity INTEGER,
    line_total_idr INTEGER,
    addons JSONB
  ) LOOP
    -- Calculate unit cogs for this variant
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

    -- Insert addons if any
    IF v_item.addons IS NOT NULL AND jsonb_array_length(v_item.addons) > 0 THEN
      FOR v_addon IN SELECT * FROM jsonb_to_recordset(v_item.addons) AS a(
        addon_id UUID,
        addon_name TEXT,
        unit_price_idr INTEGER,
        quantity INTEGER
      ) LOOP
        -- Calculate addon unit cogs
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

  -- 8. Deduct stock atomically and insert append-only inventory movements
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

  -- 9. Record audit log
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


-- 2. Atomic Void Sale Function (Admin only)
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
  -- Verify caller is active Admin
  SELECT (role = 'admin' AND is_active = true) INTO v_is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya Admin aktif yang dapat membatalkan (void) transaksi.';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Alasan void transaksi wajib diisi.';
  END IF;

  -- Fetch sale
  SELECT * INTO v_sale
  FROM public.sales
  WHERE id = p_sale_id;

  IF v_sale.id IS NULL THEN
    RAISE EXCEPTION 'Transaksi tidak ditemukan.';
  END IF;

  -- Idempotency check for void: if already voided, do nothing
  IF v_sale.status = 'void' THEN
    RETURN jsonb_build_object(
      'status', 'already_voided',
      'message', 'Transaksi sudah dibatalkan sebelumnya.'
    );
  END IF;

  -- Update sale status to void
  UPDATE public.sales
  SET status = 'void',
      void_reason = p_reason,
      void_by = auth.uid(),
      void_at = timezone('utc'::text, now())
  WHERE id = p_sale_id;

  -- Find all original sale movements for this sale
  FOR v_movement IN
    SELECT ingredient_id, quantity_delta_base, unit_cost_snapshot
    FROM public.inventory_movements
    WHERE reference_type = 'sale' AND reference_id = p_sale_id AND movement_type = 'sale'
  LOOP
    -- Reverse stock: quantity_delta_base is negative in sale, so -quantity_delta_base is positive
    UPDATE public.ingredients
    SET stock_base = stock_base + ABS(v_movement.quantity_delta_base),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_movement.ingredient_id;

    -- Insert void_reversal movement
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

  -- Audit log
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


-- 3. Atomic Stock Purchase Function with Weighted Average Cost
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
  -- Verify caller is active Admin
  SELECT (role = 'admin' AND is_active = true) INTO v_is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya Admin aktif yang dapat mencatat pembelian bahan.';
  END IF;

  -- Insert purchase header
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

  -- Process purchase items
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

    -- Insert purchase item
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

    -- Fetch current ingredient stock and average cost
    SELECT stock_base, average_cost_per_base INTO v_ing
    FROM public.ingredients
    WHERE id = v_item.ingredient_id;

    v_new_total_stock := v_ing.stock_base + v_base_qty;

    -- Calculate weighted average cost: (stok_lama * biaya_lama + base_qty * cost_per_base) / (stok_lama + base_qty)
    IF v_new_total_stock > 0 THEN
      v_new_avg_cost := ((v_ing.stock_base * v_ing.average_cost_per_base) + (v_base_qty * v_cost_per_base)) / v_new_total_stock;
    ELSE
      v_new_avg_cost := v_cost_per_base;
    END IF;

    -- Update ingredient
    UPDATE public.ingredients
    SET stock_base = v_new_total_stock,
        average_cost_per_base = ROUND(v_new_avg_cost, 4),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_item.ingredient_id;

    -- Insert inventory movement
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

  -- Audit log
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


-- 4. Atomic Inventory Adjustment / Waste Function
CREATE OR REPLACE FUNCTION public.record_inventory_adjustment_atomic(
  p_ingredient_id UUID,
  p_type TEXT, -- 'waste', 'adjustment_in', 'adjustment_out'
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
  -- Verify caller is active Admin
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
