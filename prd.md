# PRD.md — NyeniPOS

**Produk:** NyeniPOS | **Bisnis:** Mango Nyeni | **Stack:** Next.js + Supabase + Vercel  
**Bahasa UI:** Bahasa Indonesia | **Mata uang:** IDR | **Timezone:** `Asia/Jakarta`

## 1. Ringkasan

NyeniPOS adalah sistem kasir dan operasional internal Mango Nyeni untuk penjualan mango sago/dessert cup. Sistem menghubungkan transaksi, menu/harga, resep, stok bahan, pembelian bahan, waste/penyesuaian, biaya operasional, pengguna, dan laporan harian/bulanan. Aplikasi harus benar-benar berfungsi, bukan dashboard statis. Angka berasal dari database dan perubahan stok memiliki jejak audit.

## 2. Sasaran MVP

1. Login aman dengan dua role: Admin dan Kasir/Operator.
2. POS dengan produk, ukuran, add-on, keranjang, pembayaran, kembalian, dan struk.
3. CRUD produk/varian/add-on dan editor resep.
4. Stok bahan, pembelian/restock, penyesuaian, waste, dan riwayat mutasi.
5. Pencatatan biaya operasional.
6. Dashboard dan laporan harian/bulanan dengan rincian penjualan, HPP, laba estimasi, dan arus kas.
7. Export CSV, UI responsif, PWA installable, dan print struk.
8. Supabase RLS, transaksi atomik, audit log, dan konfigurasi deployment Vercel.

### Bukan target MVP
Integrasi payment gateway, akuntansi/pajak resmi, multi-cabang, marketplace, integrasi WhatsApp otomatis, payroll, dan offline transaction sync. Saat offline, transaksi baru ditahan sampai koneksi/database tersedia; jangan mengklaim transaksi sudah tersimpan.

## 3. Role dan izin

### Admin
Akses semua dashboard/laporan termasuk HPP dan laba; mengelola produk, harga, varian, add-on, resep, bahan, stok, pembelian, waste, pengeluaran, transaksi, pengguna, pengaturan, dan audit log. Admin dapat melakukan void transaksi dengan alasan wajib.

### Kasir/Operator
Dapat login, membuat transaksi, melihat katalog dan ketersediaan stok yang diperlukan untuk menjual, melihat riwayat transaksi miliknya, dan mencetak struk. Tidak dapat mengubah harga/resep, biaya bahan, stok, pengeluaran, role pengguna, pengaturan, atau laporan HPP/laba.

Tidak ada pendaftaran publik. Admin mengundang pengguna melalui email. Akun nonaktif harus kehilangan akses. Role divalidasi di server/database, bukan hanya disembunyikan di UI.

## 4. Seed katalog dan harga

Seed data dari poster Mango Nyeni:

| Produk | Varian | Harga awal |
|---|---:|---:|
| Dragon Sago | 200 ml | Rp13.000 |
| Dragon Sago | 300 ml | Rp17.000 |
| Dragon Sago | 400 ml | Rp22.000 |
| Dragon Sago | 500 ml | Rp27.000 |
| Mango Sago | 200 ml | Rp13.000 |
| Mango Sago | 300 ml | Rp17.000 |
| Mango Sago | 400 ml | Rp22.000 |
| Mango Sago | 500 ml | Rp27.000 |
| Strawberry Sago | 200 ml | Rp13.000 |
| Strawberry Sago | 300 ml | Rp17.000 |
| Strawberry Sago | 400 ml | Rp22.000 |
| Strawberry Sago | 500 ml | Rp27.000 |

Add-on awal: **Mix Fruit +Rp2.000** per cup yang dipilih. Semua harga dapat diedit Admin. Harga di atas diterapkan pada semua menu karena poster menampilkan satu daftar ukuran/harga umum.

Bahan dapat mencakup mangga, susu, sago, buah naga, stroberi, gula/sirup, air, cup, tutup, sendok, segel, dan bahan lain. **Takaran resep tidak disediakan. Jangan mengarang takaran.** Admin harus memasukkan resep nyata sebelum penjualan yang mengurangi stok diaktifkan. URL Instagram belum diberikan; jangan membuat URL palsu.

## 5. Alur utama

### Setup awal
1. Konfigurasikan Supabase dan environment variables.
2. Buat Admin awal lewat Supabase Dashboard atau prosedur bootstrap aman yang didokumentasikan.
3. Admin memeriksa seed menu/harga.
4. Admin membuat bahan dengan satuan dasar, konversi, stok awal, minimum stok, dan biaya awal.
5. Admin memasukkan resep untuk setiap varian dan add-on.
6. Admin mengundang Kasir melalui email.
7. Varian dengan resep belum lengkap diberi peringatan dan tidak dapat dijual dengan pengurangan stok yang tidak akurat.

### Penjualan
1. Kasir memilih produk, ukuran, add-on, dan jumlah.
2. Keranjang menghitung subtotal dari harga aktif.
3. Kasir memilih Tunai, QRIS, atau Transfer.
4. Untuk Tunai, masukkan uang diterima; sistem menghitung kembalian dan menolak uang yang kurang.
5. Server/database memvalidasi role, harga, resep, stok, dan payload.
6. Satu operasi database atomik membuat transaksi, item, snapshot HPP, inventory movements, dan pengurangan stok.
7. Setelah commit berhasil, tampilkan nomor transaksi dan struk.
8. Retry/double click tidak boleh membuat transaksi ganda.

### Pembelian/restock
Admin memasukkan tanggal, bahan, kuantitas satuan pembelian, biaya unit, dan pemasok opsional. Sistem mengonversi jumlah ke satuan dasar lalu memperbarui stok, biaya rata-rata, pembelian, dan movement secara atomik.

### Waste/penyesuaian
Admin mencatat bahan, jumlah masuk/keluar, alasan, dan catatan. Waste bahan rusak/kedaluwarsa memakai movement khusus. Tidak boleh mengubah stok tanpa movement.

### Void
Hanya Admin; alasan wajib; transaksi berubah status `void`, tidak dihapus. Stok dikembalikan melalui movement reversal yang terkait dengan transaksi asli. Operasi idempotent supaya void berulang tidak mengembalikan stok dua kali.


## 6. Persyaratan fungsional

### FR-01 — Auth dan pengguna
Supabase Auth email/password, protected routes, logout, session-expired handling, tanpa public signup. Admin dapat mengundang dan menonaktifkan pengguna. Role dan status aktif divalidasi di server/database.

### FR-02 — POS
Pencarian/filter katalog; pilih produk/varian/add-on/quantity; edit quantity dan hapus item; total real-time; Tunai/QRIS/Transfer; kembalian tunai; struk; transaksi idempotent. Jika offline, tampilkan banner offline dan nonaktifkan submit. Jangan tampilkan sukses sebelum database mengonfirmasi commit.

### FR-03 — Menu dan resep
CRUD produk, varian, harga, add-on, aktif/nonaktif. Harga disimpan sebagai integer Rupiah, bukan float. Harga/nama disalin ke snapshot transaksi. Resep dibuat per varian dan add-on, dengan kuantitas per porsi pada satuan dasar bahan. Transaksi diblokir jika resep yang dibutuhkan belum lengkap.

### FR-04 — Inventori
Setiap bahan memiliki `base_unit` (`g`, `ml`, `pcs`), `purchase_unit`, `conversion_to_base`, stok dasar, minimum stok, dan biaya rata-rata per satuan dasar. Contoh konversi: 1 kg = 1.000 g dan 1 liter = 1.000 ml; ini bukan takaran resep. Stok tidak boleh negatif. Jenis mutasi: pembelian, penjualan, penyesuaian masuk/keluar, waste, dan reversal void.

### FR-05 — Pembelian stok
Simpan header/item pembelian, pemasok opsional, tanggal, jumlah pembelian, unit/faktor konversi snapshot, biaya, total, status pembayaran, dan pembuat. Perbarui biaya rata-rata tertimbang:
`(stok_lama × biaya_rata_lama + qty_masuk_dasar × biaya_masuk_per_dasar) / (stok_lama + qty_masuk_dasar)`.
Pembelian stok tidak boleh dihitung sebagai pengeluaran operasional sekaligus HPP.

### FR-06 — Pengeluaran operasional
Kategori, tanggal, nominal integer Rupiah, metode bayar, catatan, pembuat, timestamps. Kategori awal: transportasi, listrik/air, promosi, perlengkapan non-stok, biaya platform, lainnya. Pembelian bahan baku dicatat lewat modul pembelian stok. Edit/void hanya Admin dan harus diaudit.

### FR-07 — Dashboard/laporan
Filter hari ini, kemarin, 7 hari, bulan ini, bulan lalu, rentang tanggal. Tampilkan omzet kotor, diskon, omzet bersih, transaksi, cup terjual, HPP estimasi, laba kotor estimasi, biaya operasional, laba operasional estimasi, metode pembayaran, produk terlaris, bahan terpakai, stok rendah, pembelian, waste, dan stok akhir. Export CSV mengikuti filter, role, dan timezone. Semua angka production berasal dari database.

### FR-08 — Audit dan integritas
Audit perubahan harga, resep, stok, pembelian, pengeluaran, role, settings, dan void. Inventory movements append-only. Penjualan, stok, snapshot HPP, dan movements harus commit atomik melalui PostgreSQL RPC/function atau transaksi database setara. Gunakan unique idempotency key. Histori tidak boleh hilang saat menu diedit.

### FR-09 — Responsif/PWA
Responsif 320 px hingga desktop; installable PWA; app shell boleh tersedia offline tetapi transaksi tulis ditolak jika server tidak tersedia. Loading, empty, error, offline, permission, dan retry states harus dirancang.

## 7. Aturan bisnis dan rumus

Nominal uang disimpan integer Rupiah. Filter tanggal menggunakan `Asia/Jakarta`.

- `subtotal = Σ((harga_varian + Σ harga_add_on) × quantity)`
- `omzet_bersih = subtotal - diskon`
- `HPP = Σ biaya bahan yang dikonsumsi sesuai resep × jumlah terjual`, memakai biaya bahan saat transaksi
- `laba_kotor_estimasi = omzet_bersih - HPP`
- `laba_operasional_estimasi = omzet_bersih - HPP - pengeluaran_operasional`
- `arus_kas_bersih = pembayaran_penjualan_diterima - pembelian_stok_dibayar - pengeluaran_operasional_dibayar`

Pembelian stok tidak dikurangkan lagi dari laba operasional karena bahan yang terpakai sudah dihitung sebagai HPP. Laporan laba dan arus kas harus terpisah. Label HPP/laba sebagai **estimasi**, bukan laporan akuntansi final.

Untuk Tunai: `kembalian = uang_diterima - total`; tolak bila uang diterima kurang. Untuk QRIS/Transfer tidak ada kembalian dan pembayaran harus sama dengan total. Split payment di luar MVP.

## 8. Model data minimum

Gunakan PostgreSQL/Supabase, UUID, foreign keys, timestamps, constraints, dan indexes.

1. `profiles`: `id` FK `auth.users`, `full_name`, `role` (`admin`/`cashier`), `is_active`.
2. `products`: `id`, `name`, `description`, `category`, `image_path` opsional, `is_active`, `sort_order`.
3. `product_variants`: `id`, `product_id`, `name`, `volume_ml`, `price_idr`, `is_active`.
4. `addons`: `id`, `name`, `price_idr`, `is_active`.
5. `ingredients`: `id`, `name`, `base_unit`, `purchase_unit`, `conversion_to_base`, `stock_base`, `minimum_stock_base`, `average_cost_per_base`, `is_active`.
6. `variant_recipe_items`: `variant_id`, `ingredient_id`, `quantity_base_per_serving`.
7. `addon_recipe_items`: `addon_id`, `ingredient_id`, `quantity_base_per_addon`.
8. `sales`: `id`, `receipt_number`, `cashier_id`, `status`, `payment_method`, `subtotal_idr`, `discount_idr`, `total_idr`, `cash_received_idr`, `change_due_idr`, `idempotency_key`, `created_at`, void metadata.
9. `sale_items`: `sale_id`, snapshot nama/varian, unit price, quantity, line total, unit/line COGS.
10. `sale_item_addons`: `sale_item_id`, snapshot nama add-on, unit price, quantity, line total, recipe cost snapshot.
11. `inventory_movements`: `ingredient_id`, `movement_type`, `quantity_delta_base`, `unit_cost_snapshot`, `reference_type`, `reference_id`, `reason`, `created_by`, `created_at`.
12. `stock_purchases`: `purchase_number`, `supplier_name` opsional, `purchase_date`, `total_cost_idr`, `payment_status`, notes, creator.
13. `stock_purchase_items`: purchase, ingredient, purchase quantity/unit, conversion snapshot, base quantity, unit cost, line total.
14. `expenses`: category, description, `amount_idr`, `expense_date`, payment method, status, creator, timestamps.
15. `audit_logs`: actor, action, entity type/id, before/after data, reason, timestamp.
16. `business_settings`: business name, timezone, receipt settings, payment methods, optional Instagram URL.

Buat constraint harga/quantity positif, unique `receipt_number`, unique `idempotency_key`, index tanggal/status/foreign keys, dan enum/check constraints yang sesuai.

## 9. Keamanan dan deployment

- Aktifkan RLS di seluruh tabel yang terekspos.
- Jangan pernah mengirim `SUPABASE_SERVICE_ROLE_KEY` ke browser; gunakan hanya pada server handler yang memverifikasi sesi dan role Admin.
- Gunakan `.env.example`; jangan commit `.env.local`.
- RLS membatasi Kasir ke transaksi yang diizinkan dan melarang akses tulis ke inventori/pengaturan.
- Fungsi database berprivilege tinggi harus memverifikasi `auth.uid()`, role aktif, memakai `search_path` aman, dan hanya memberi execute ke role tepat.
- Endpoint Admin tidak boleh hanya dilindungi kondisi React.
- Siapkan migration SQL yang aman, seed menu/harga, dan dokumentasi bootstrap Admin pertama.
- Production tanpa konfigurasi Supabase harus menampilkan error konfigurasi jelas, bukan diam-diam memakai localStorage/demo data.

## 10. Acceptance criteria

- Admin dan Kasir login dengan izin berbeda; akses ilegal ditolak server/database.
- Produk, harga, resep, bahan, pembelian, waste, dan pengeluaran tersimpan serta dapat dikelola sesuai role.
- Penjualan mencatat item, pembayaran, snapshot HPP, mutasi, dan pengurangan stok secara atomik.
- Stok kurang, resep belum lengkap, dan retry idempotency tidak membuat data parsial atau transaksi ganda.
- Tunai menghitung kembalian benar; QRIS/Transfer tidak menampilkan kembalian.
- Void Admin membalik stok tepat sekali dan tetap menyimpan histori.
- Laporan harian/bulanan membedakan laba dari arus kas dan konsisten dengan data sumber.
- CSV mengikuti filter; UI berfungsi pada Android, iOS, tablet, Windows/Chrome, dan lebar 320 px tanpa overflow.
- `lint`, typecheck, test, dan production build lulus; error yang tersisa didokumentasikan spesifik.
