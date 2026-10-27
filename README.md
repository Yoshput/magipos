# MagiPOS / NyeniPOS — Mango Nyeni Operational & POS System

Sistem kasir (POS) dan operasional kuliner end-to-end untuk brand dessert **Mango Nyeni**, dibangun dengan Next.js App Router, TypeScript strict, Tailwind CSS, serta arsitektur **Dual-Storage** (Mode Standalone LocalStorage untuk demo/offline instan, dan Mode Supabase Cloud PostgreSQL dengan RLS untuk produksi multi-perangkat).

Repository Resmi: `https://github.com/Yoshput/magipos`  
Live Demo Vercel: `https://magipos.vercel.app`

---

## 🌟 Kredensial Akun Bawaan (Siap Pakai)

Aplikasi dilengkapi tombol **1-Klik Isi Cepat** pada halaman Login internal:

| Peran (Role) | Username | Email | Password | Hak Akses & Batasan |
| :--- | :--- | :--- | :--- | :--- |
| **Admin (Owner)** | `admin` | `admin@magi.com` | `admin123` | Akses penuh: POS, Menu & Resep, Stok Bahan, Pembelian (Restock), HPP & Laba, Pengeluaran, Laporan Keuangan, Void Transaksi, Pengaturan & Backup JSON |
| **Kasir (Operator)** | `kasir_yossika` | `kasir_yossika@magi.com` | `kasirsukses2026` | Akses operasional kasir: POS Kasir, Riwayat Transaksi, Cetak Struk Digital. **Tidak dapat** mengubah harga/resep/stok, mencatat pengeluaran, atau melihat HPP/Laba |

---

## 🏗️ Rekonsiliasi Arsitektur Penyimpanan (Dual-Mode)

MagiPOS mendukung dua mode penyimpanan yang jelas dan transparan:

### Mode A: Standalone / Demo Lokal (Default)
- **Engine:** Browser LocalStorage Engine terisolasi (`src/lib/storage/local-db.ts`).
- **Keunggulan:**
  * Siap pakai seketika di Vercel tanpa perlu setup database eksternal (*Zero-Config*).
  * Latensi 0ms dan mendukung penggunaan offline via PWA.
  * Dilengkapi tombol **Unduh Cadangan JSON (.json)**, **Impor Cadangan JSON**, dan **Reset ke Data Awal Poster** di menu Pengaturan (`/settings`).

### Mode B: Supabase Cloud PostgreSQL (Production Multi-Device)
- **Engine:** Supabase PostgreSQL dengan Row-Level Security (RLS) dan atomic stored procedures (`create_sale_atomic`, `void_sale_atomic`).
- **Skema & Migrasi:** Tersedia lengkap di direktori `supabase/full_schema.sql` dan `supabase/seed.sql`.
- **Aktivasi:**
  1. Buat project di [Supabase Dashboard](https://supabase.com).
  2. Buka **SQL Editor** Supabase, salin dan jalankan seluruh isi file `supabase/full_schema.sql`.
  3. Masukkan environment variables di Vercel atau file `.env.local`:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT].supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
     ```
  4. Lakukan redeploy. Sistem otomatis mendeteksi Supabase dan beralih ke Mode Cloud.

---

## 💳 Metode Pembayaran & Verifikasi Manual Kasir

MagiPOS menerapkan **pencatatan pembayaran manual murni** (tanpa ketergantungan pihak ketiga seperti Midtrans, Xendit, Stripe, dynamic QR, atau webhook yang rentan downtime):

1. **Tunai (Cash):**
   - Validasi uang diterima $\ge$ total tagihan.
   - Kembalian dihitung akurat dalam integer Rupiah.
   - Tombol nominal cepat: Uang Pas, Rp20.000, Rp50.000, Rp100.000.
2. **QRIS GoPay Merchant (Statis):**
   - Menampilkan poster QRIS resmi GoPay Merchant (`/assets/qris-gopay-merchant.webp`) NMID `ID1026485705432` a/n **MAGI NYENI STORE, MAKANAN**.
   - Dilengkapi tombol perbesar QR fullscreen untuk kenyamanan scan pelanggan.
   - **Wajib Verifikasi Manual:** Kasir wajib mencentang checkbox:  
     *`"Saya sudah memeriksa notifikasi/riwayat GoPay Merchant dan memastikan pembayaran sebesar [Total] sudah masuk."`* sebelum tombol konfirmasi pembayaran dapat diklik.
3. **Transfer Bank (blu by BCA):**
   - Rekening resmi: **blu by BCA — 000596641881 a/n Yossika Putra Erlangga**.
   - Dilengkapi tombol 1-klik salin nomor rekening ke clipboard.
   - **Wajib Verifikasi Manual:** Kasir wajib mencentang checkbox:  
     *`"Saya sudah memeriksa mutasi rekening blu by BCA dan memastikan transfer sebesar [Total] sudah masuk."`*

---

## 🍓 Produk, Varian & Add-on Recipe

- **Produk Resmi:**
  1. **Dragon Sago** (200 ml: Rp13.000, 300 ml: Rp17.000, 400 ml: Rp22.000, 500 ml: Rp27.000)
  2. **Mango Sago** (200 ml: Rp13.000, 300 ml: Rp17.000, 400 ml: Rp22.000, 500 ml: Rp27.000)
  3. **Strawberry Sago** (200 ml: Rp13.000, 300 ml: Rp17.000, 400 ml: Rp22.000, 500 ml: Rp27.000)
- **Add-on Mix Fruit:** (+Rp2.000 per cup).
  * Mengonsumsi bahan: 15g mangga harum manis + 15g buah naga merah + 15g stroberi segar per cup.
  * Kalkulasi multi-cup: `(harga_varian + addon_per_cup) * qty_cup`.
- **Integritas Resep & HPP:**
  * Resep bawaan ditandai sebagai **Estimasi Awal** hingga Admin menekan tombol **Verifikasi Resep** di menu Resep.
  * Kasir tidak diblokir saat menjual menu dengan resep yang belum diatur; sistem mencatat transaksi dan melewatkan pemotongan stok dengan aman.
  * HPP dihitung dinamis dari harga beli rata-rata bahan baku (*Weighted Average Cost*) saat transaksi dibuat.

---

## 🧪 Perintah Verifikasi & Testing

Jalankan rangkaian pengujian otomatis di terminal:

```bash
# 1. Jalankan unit & acceptance test
npm test

# 2. Pemeriksaan tipe TypeScript
npm run typecheck

# 3. Linter kode Next.js
npm run lint

# 4. Production build test
npm run build
```

---

## 📱 Responsiveness & PWA

- Teruji responsif pada resolusi 320 px, 360 px, 375 px, 390 px, tablet, dan desktop.
- Menggunakan floating cart bar di mobile yang berada tepat di atas bottom navigation bar tanpa tumpang-tindih.
- Dukungan PWA penuh dengan `manifest.json` dan icons.

---

&copy; 2026 **Mango Nyeni**. Standar operasional F&B profesional dan teruji.
