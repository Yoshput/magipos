-- NyeniPOS: Seed Data
-- Seed menu items from official Mango Nyeni price list poster

-- 1. Insert Products
INSERT INTO public.products (id, name, description, category, image_path, sort_order)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Dragon Sago', 'Dessert cup segar dengan perpaduan buah naga merah pilihan, sagu mutiara, dan saus creamy spesial Mango Nyeni.', 'Dessert Cup', '/assets/mango-sago-only.png', 1),
  ('22222222-2222-2222-2222-222222222222', 'Mango Sago', 'Dessert cup signature dengan mangga harum manis legit berlimpah, jelly mangga, dan kuah susu kental manis gurih.', 'Dessert Cup', '/assets/mango-sago-splash-stack.png', 2),
  ('33333333-3333-3333-3333-333333333333', 'Strawberry Sago', 'Dessert cup sensasi asam manis stroberi segar dengan sagu mutiara kenyal dan racikan susu premium.', 'Dessert Cup', '/assets/mango-sago-only.png', 3)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Variants for each product (200ml, 300ml, 400ml, 500ml)
-- Dragon Sago variants
INSERT INTO public.product_variants (id, product_id, name, volume_ml, price_idr)
VALUES
  ('11111111-0001-0000-0000-000000000200', '11111111-1111-1111-1111-111111111111', '200 ml', 200, 13000),
  ('11111111-0001-0000-0000-000000000300', '11111111-1111-1111-1111-111111111111', '300 ml', 300, 17000),
  ('11111111-0001-0000-0000-000000000400', '11111111-1111-1111-1111-111111111111', '400 ml', 400, 22000),
  ('11111111-0001-0000-0000-000000000500', '11111111-1111-1111-1111-111111111111', '500 ml', 500, 27000)
ON CONFLICT (id) DO NOTHING;

-- Mango Sago variants
INSERT INTO public.product_variants (id, product_id, name, volume_ml, price_idr)
VALUES
  ('22222222-0002-0000-0000-000000000200', '22222222-2222-2222-2222-222222222222', '200 ml', 200, 13000),
  ('22222222-0002-0000-0000-000000000300', '22222222-2222-2222-2222-222222222222', '300 ml', 300, 17000),
  ('22222222-0002-0000-0000-000000000400', '22222222-2222-2222-2222-222222222222', '400 ml', 400, 22000),
  ('22222222-0002-0000-0000-000000000500', '22222222-2222-2222-2222-222222222222', '500 ml', 500, 27000)
ON CONFLICT (id) DO NOTHING;

-- Strawberry Sago variants
INSERT INTO public.product_variants (id, product_id, name, volume_ml, price_idr)
VALUES
  ('33333333-0003-0000-0000-000000000200', '33333333-3333-3333-3333-333333333333', '200 ml', 200, 13000),
  ('33333333-0003-0000-0000-000000000300', '33333333-3333-3333-3333-333333333333', '300 ml', 300, 17000),
  ('33333333-0003-0000-0000-000000000400', '33333333-3333-3333-3333-333333333333', '400 ml', 400, 22000),
  ('33333333-0003-0000-0000-000000000500', '33333333-3333-3333-3333-333333333333', '500 ml', 500, 27000)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Addon
INSERT INTO public.addons (id, name, price_idr)
VALUES
  ('44444444-4444-4444-4444-444444444444', 'Mix Fruit', 2000)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Standard Ingredients Catalog (with base conversion)
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

-- Note on Recipes: Per PRD and AGENT guidelines, takaran resep tidak dikarang secara fiktif.
-- Admin mengisi takaran resep nyata melalui menu Editor Resep.

-- 5. Business Settings Default
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
