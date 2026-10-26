# NyeniPOS — Mango Nyeni Operational & POS System

Sistem kasir dan operasional end-to-end untuk bisnis dessert cup **Mango Nyeni**, dibangun dengan Next.js App Router, TypeScript strict, Tailwind CSS, serta arsitektur **Zero-Config Standalone Local Database** (berjalan langsung di browser / Vercel tanpa perlu setup database luar) dengan opsi backup & restore JSON.

---

## 🌟 Akun Demo & Siap Pakai (Pre-Generated Credentials)

Aplikasi telah dilengkapi akun bawaan yang aktif secara default dengan tombol **1-Klik Isi Cepat** pada halaman Login:

| Peran (Role) | Email | Password | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Admin (Owner)** | `admin@mangonyeni.com` | `admin123` | Akses penuh: POS, Menu, Stok, Resep, HPP & Laba, Pengeluaran, Laporan, Manajemen User, Pengaturan & Backup |
| **Kasir (Operator)** | `kasir@mangonyeni.com` | `kasir123` | Akses operasional: POS Kasir, Riwayat Transaksi Kasir, Cetak Struk (tanpa akses ke HPP/Laba/Pengaturan) |

---

## ⚡ Keunggulan Arsitektur Standalone (Zero-Config)

1. **Deploy ke Vercel Tanpa Setup Database Luar:**
   - Tidak memerlukan koneksi Supabase atau database cloud berbayar.
   - Tanpa konfigurasi *environment variables* yang rumit — cukup push ke Vercel dan langsung berjalan 100%.
2. **Latensi 0ms & Offline-First (PWA):**
   - Transaksi diproses seketika di penyimpanan persisten browser (`localStorage`).
   - Dapat diinstall sebagai aplikasi PWA pada tablet kasir atau smartphone Android/iOS.
3. **Penyimpanan Aman & Fitur Backup / Restore:**
   - Database tersimpan rapi di browser lokal dengan validasi struktur data.
   - Tersedia tombol **Ekspor Backup Database (.json)** dan **Reset Database ke Awal** di menu Pengaturan (`/settings`).

---

## 🌟 Fitur Utama

1. **Autentikasi & Otorisasi Berbasis Peran (RBAC):**
   - Role **Admin** dan **Kasir** tervalidasi via Next.js middleware (`src/middleware.ts`) dan context auth.
   - Kasir hanya dapat mengakses POS dan riwayat transaksi, tanpa akses ke HPP/laba atau pengeluaran.
   - Admin dapat menambah kasir baru dan mengaktifkan/menonaktifkan akun.
2. **Kasir (POS) Cepat & Responsif:**
   - Katalog menu dengan pencarian real-time dan tab kategori.
   - Pilihan varian ukuran cup (200 ml, 300 ml, 400 ml, 500 ml) dan add-on Mix Fruit.
   - Pembatasan checkout otomatis jika resep varian belum diisi (mencegah stok minus/salah).
   - Metode pembayaran: Tunai (dengan kalkulator kembalian & tombol uang pas/cepat), QRIS, dan Transfer Bank.
   - Transaksi atomik dan idempotent (mencegah *double-click* atau duplikasi pesanan).
   - Struk siap cetak dengan format thermal 58 mm / 80 mm via browser print (`window.print()`).
3. **Menu, Varian & Editor Resep:**
   - Pre-seeded resmi: **Dragon Sago**, **Mango Sago**, dan **Strawberry Sago**.
   - Harga awal: 200 ml (Rp 13.000), 300 ml (Rp 17.000), 400 ml (Rp 22.000), 500 ml (Rp 27.000); Add-on Mix Fruit (+Rp 2.000). Harga dapat diedit Admin.
   - Editor takaran resep nyata per porsi pada satuan dasar (`g`, `ml`, `pcs`).
4. **Stok Bahan Baku & Mutasi Append-Only:**
   - Satuan dasar (`g`, `ml`, `pcs`), satuan pembelian (`kg`, `liter`, `pack`), dan faktor konversi otomatis.
   - Indikator status stok: Aman, Menipis, Habis dengan peringatan visual.
   - Pencatatan penyesuaian stok opname fisik dan waste bahan rusak dengan alasan wajib.
   - Seluruh mutasi dicatat dalam riwayat mutasi (*inventory movements*).
5. **Pembelian Bahan Baku (Restock):**
   - Penerimaan stok baru dengan preview konversi ke satuan dasar.
   - Perhitungan biaya rata-rata tertimbang (*Weighted Average Cost*) otomatis secara atomik:
     $$\text{Biaya Baru} = \frac{(\text{Stok Lama} \times \text{Biaya Lama}) + (\text{Qty Masuk} \times \text{Biaya Masuk})}{\text{Stok Lama} + \text{Qty Masuk}}$$
   - Pembelian bahan dipisahkan dari biaya operasional untuk mencegah *double counting*.
6. **Pengeluaran Operasional:**
   - Kategori: Transportasi, Listrik & Air, Promosi, Perlengkapan Non-Stok, Biaya Platform, dan Lainnya.
   - Pembatalan (void) pengeluaran hanya untuk Admin dengan alasan wajib.
7. **Riwayat Transaksi & Pembatalan (Void):**
   - Pencarian No. Transaksi, filter tanggal, kasir, metode pembayaran, dan status.
   - Fitur Void khusus Admin dengan alasan wajib. Mengembalikan stok bahan secara otomatis via movement `void_reversal`.
8. **Laporan Keuangan & Arus Kas Terpisah:**
   - Filter periode: Hari ini, Kemarin, 7 hari terakhir, Bulan ini, Bulan lalu, dan Rentang tanggal kustom (timezone `Asia/Jakarta`).
   - Laba Rugi Estimasi: Omzet Kotor, Diskon, Omzet Bersih, HPP Estimasi (COGS), Laba Kotor Estimasi, Biaya Operasional, dan Laba Operasional Estimasi.
   - **Laporan Arus Kas Terpisah:** Kas Masuk Penjualan, Kas Keluar Pembelian Stok Lunas, Kas Keluar Pengeluaran Operasional, dan Arus Kas Bersih.
   - Peringkat menu terlaris dan rekap konsumsi bahan baku.
   - Ekspor data laporan ke CSV berstandar RFC 4180.
9. **Desain Bergaya iOS & PWA:**
   - Design tokens: Navy (`#142A72`), Blue (`#1769E8`), Mango (`#FFC928`).
   - Responsif mulai layar 320 px hingga monitor desktop tanpa horizontal overflow.
   - PWA installable dengan `manifest.json`.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19
- **Bahasa:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS + Lucide Icons + Framer Motion
- **Grafik:** Recharts
- **Penyimpanan & State:** Persistent Local Storage Engine (`src/lib/storage/local-db.ts`)
- **Pengujian:** Vitest
- **Deployment Target:** Vercel (Zero-Config)

---

## 🚀 Panduan Menjalankan Lokal

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Jalankan Server Dev
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

### 3. Login
Gunakan tombol 1-klik di halaman login atau masukkan:
- **Email:** `admin@mangonyeni.com`
- **Password:** `admin123`

---

## 🚢 Panduan Deployment ke Vercel (Zero-Config)

1. Push repository Anda ke GitHub / GitLab:
   ```bash
   git add .
   git commit -m "feat: complete NyeniPOS standalone"
   git push origin main
   ```
2. Buka [Vercel Dashboard](https://vercel.com) dan klik **"Add New Project"**.
3. Import repository **Magi Pos / NyeniPOS**.
4. Tidak perlu mengisi environment variable apa pun (Zero Configuration).
5. Klik **"Deploy"**. Vercel akan otomatis melakukan build dan aplikasi siap digunakan secara publik dalam waktu kurang dari 1 menit!

---

## 🧪 Perintah Verifikasi Kualitas

Proyek ini dilengkapi pengujian dan verifikasi lengkap:

1. **Unit Testing (Vitest):**
   ```bash
   npm test
   ```
2. **Typecheck (TypeScript Strict):**
   ```bash
   npm run typecheck
   ```
3. **Linter (ESLint):**
   ```bash
   npm run lint
   ```
4. **Production Build:**
   ```bash
   npm run build
   ```

---

## 📂 Struktur Direktori Proyek

```
Magi Pos/
├── assets/                     # Aset logo dan gambar produk asli
├── public/                     # Static public assets & PWA manifest.json
├── src/
│   ├── app/                    # Next.js App Router (pages & API handlers)
│   │   ├── dashboard/          # Ringkasan KPI omzet & grafik
│   │   ├── expenses/           # Pengeluaran operasional
│   │   ├── inventory/          # Stok bahan, mutasi append-only, restock
│   │   ├── login/              # Halaman login internal dengan quick credentials
│   │   ├── menu/               # CRUD menu, harga, dan editor resep
│   │   ├── pos/                # Kasir POS, katalog, keranjang, checkout
│   │   ├── reports/            # Laporan keuangan & pemisahan arus kas
│   │   ├── settings/           # Pengaturan toko, struk, backup & reset JSON
│   │   ├── transactions/       # Riwayat transaksi & void khusus Admin
│   │   ├── users/              # Manajemen akun kasir dan admin
│   │   ├── globals.css         # Styling global & layout thermal print
│   │   └── layout.tsx          # Root layout & providers
│   ├── components/             # Reusable UI & Layout components
│   ├── context/                # AuthContext & CartContext
│   ├── features/pos/           # Komponen domain POS (Cart, Modals, Struk)
│   ├── lib/
│   │   ├── storage/local-db.ts # Standalone persistent local storage engine
│   │   ├── calculations.ts     # Formula keuangan, WAC, dan kembalian
│   │   ├── formatters.ts       # Format mata uang IDR & tanggal WIB
│   │   └── csv.ts              # Generator CSV RFC 4180
│   └── types/                  # Strong TypeScript definitions
├── tests/                      # Unit test Vitest untuk formula keuangan
└── README.md                   # Dokumentasi panduan operasional
```

---

&copy; 2026 **Mango Nyeni**. Dibangun dengan standar rekayasa perangkat lunak modern untuk keandalan operasional bisnis kuliner.
