# DESIGN.md — NyeniPOS

## 1. Arah desain

NyeniPOS adalah sistem operasional internal Mango Nyeni. UI harus modern, rapi, cepat, dan mudah dipahami pemilik usaha kecil maupun kasir baru. Gunakan prinsip visual iOS: tipografi jelas, hierarki tenang, ruang kosong cukup, radius konsisten, state jelas, animasi singkat, dan navigasi yang dapat diprediksi. Ini aplikasi web responsif, bukan tiruan literal iOS. Hindari glassmorphism berlebihan, gradient di setiap kartu, warna berlebihan, dan dashboard dekoratif yang tidak membantu kerja.

Aset brand:
- `assets/logo-mango-nyeni.png`
- `assets/price-list-mango-sago.png`
- `assets/mango-sago-only.png`
- `assets/mango-sago-splash-stack.png`

Gunakan logo sebagai aset utama. Foto produk boleh dipakai pada POS dan katalog. Jangan memakai poster harga sebagai latar dashboard.

## 2. Prinsip desain
1. **Operational first:** aksi kasir utama tercapai dalam 1–3 interaksi.
2. **Mobile first:** tombol besar, label jelas, tidak bergantung pada hover.
3. **Financial clarity:** pisahkan omzet, HPP, laba, biaya operasional, pembelian stok, dan arus kas.
4. **Progressive disclosure:** detail lanjutan lewat drawer, modal, tab, atau halaman detail.
5. **Honest state:** loading, empty, offline, permission denied, dan error harus terlihat dan menjelaskan langkah berikutnya.
6. **No fake controls:** semua tombol, filter, tab, chart controls, dan menu harus berfungsi.
7. **Accessible:** kontras baik, keyboard navigation, focus ring, label input, reduced-motion support.

## 3. Design tokens

Buat CSS variables atau Tailwind theme terpusat.

### Warna
- `--nyeni-navy: #142A72` — heading dan elemen brand.
- `--nyeni-blue: #1769E8` — primary action, link, selected state.
- `--nyeni-blue-soft: #EAF2FF` — selected background.
- `--nyeni-mango: #FFC928` — aksen brand terbatas.
- `--nyeni-mango-soft: #FFF5D1` — highlight lembut.
- `--surface: #FFFFFF`; `--background: #F5F7FB`.
- `--foreground: #172033`; `--muted: #667085`; `--border: #E5E9F2`.
- `--success: #16845B`; `--warning: #B86A00`; `--danger: #C93636`; `--info: #1769E8`.

Warna status harus disertai teks/ikon, jangan mengandalkan warna saja.

### Tipografi dan spacing
- Font: system stack cepat, `Inter` bila tersedia/dioptimasi, lalu `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- Heading halaman 24–30 px desktop dan 22–26 px mobile; body 14–16 px; metadata 12–13 px.
- Angka uang memakai `tabular-nums`. Format konsisten: `Rp 13.000`.
- Input/button radius 10–12 px; card 16–20 px; modal/sheet 20–24 px.
- Border 1 px; shadow halus untuk elemen mengambang saja.
- Gunakan spacing kelipatan 4/8 px. Tap target mobile minimal 44 × 44 px; tombol checkout idealnya 48–52 px.

## 4. Layout responsif

### Desktop/laptop (≥1024 px)
- Sidebar 240–260 px, bisa diciutkan.
- Top bar: breadcrumb/judul, status koneksi, menu profil.
- Dashboard: empat KPI cards bila cukup ruang, chart dan ringkasan dalam dua kolom.
- POS: katalog di kiri, keranjang/checkout di kanan. Keranjang sticky tidak boleh menutupi konten/modal.

### Tablet (768–1023 px)
- Sidebar menjadi ikon/drawer.
- KPI grid dua kolom.
- Keranjang menjadi drawer/sheet bila layar sempit.
- Tabel tidak boleh menyebabkan seluruh halaman scroll horizontal.

### Mobile (<768 px)
- Top bar ringkas.
- Bottom nav: Ringkasan, Kasir, Transaksi, Stok, Lainnya.
- KPI dua kolom atau daftar ringkas; form satu kolom.
- Filter laporan memakai bottom sheet/drawer.
- Tabel boleh berubah menjadi list/card rows.
- Checkout memakai sticky bottom action dengan safe-area iOS.
- Tidak ada interaksi utama yang bergantung pada hover/drag.
- Pastikan tidak ada overflow horizontal pada lebar 320 px.

## 5. App shell dan navigasi

Menu: Ringkasan, Kasir, Transaksi, Stok bahan, Laporan, Menu & resep, Pengeluaran, Pengguna (Admin), Pengaturan (Admin). Desktop memakai sidebar berkelompok; mobile memprioritaskan lima tujuan utama di atas. Menu yang tidak diizinkan tidak ditampilkan dan tetap harus dilindungi di server/database.

Setiap halaman memiliki judul jelas, primary action, loading state, empty state, error state, dan permission state bila relevan. Active nav menggunakan latar biru muda dengan ikon/teks biru.

## 6. Detail layar

### Login
Logo, nama NyeniPOS, email, password, toggle tampilkan password, validasi inline, loading state. Tidak ada pendaftaran publik. Error login jelas tetapi tidak membocorkan apakah email terdaftar.

### Ringkasan/dashboard
KPI: omzet bersih hari ini, jumlah transaksi, estimasi laba operasional, stok menipis. Tambahkan grafik penjualan, metode pembayaran, produk terlaris, aktivitas terakhir, dan peringatan stok. Kasir tidak boleh melihat HPP/margin. Klik elemen interaktif membuka rincian/filter yang sesuai.

### Kasir/POS
- Pencarian produk, kategori, kartu produk, ukuran, harga, foto bila ada.
- Produk awal: Dragon Sago, Mango Sago, Strawberry Sago.
- Ukuran/harga awal: 200 ml Rp13.000; 300 ml Rp17.000; 400 ml Rp22.000; 500 ml Rp27.000.
- Add-on Mix Fruit +Rp2.000.
- Keranjang menampilkan produk, ukuran, add-on, jumlah, harga satuan, subtotal, dan kontrol hapus.
- Checkout menampilkan subtotal, diskon bila diizinkan, total, metode Tunai/QRIS/Transfer.
- Tunai: input uang diterima dan kembalian otomatis; uang diterima tidak boleh kurang dari total. QRIS/transfer: tidak ada kembalian.
- Konfirmasi final sebelum simpan; setelah sukses tampilkan nomor transaksi dan struk.
- Struk dapat dicetak dengan layout thermal 58/80 mm melalui print browser.
- Resep yang belum lengkap atau stok tidak cukup harus memblokir checkout dan menjelaskan penyebab.
- Saat offline, tampilkan banner offline dan nonaktifkan penyimpanan. Jangan menyatakan transaksi tersimpan jika server belum mengonfirmasi.

### Transaksi
Cari/filter nomor transaksi, tanggal, metode, status, dan kasir. Detail menampilkan item, ukuran, add-on, diskon, total, metode, dan waktu. Kasir default hanya melihat transaksinya sendiri; Admin melihat semua. Void hanya Admin, alasan wajib, stok dibalik secara atomik, audit log dibuat. Jangan menghapus transaksi permanen.

### Stok bahan
Tampilkan nama, stok, satuan dasar, minimum, biaya rata-rata/satuan, nilai stok, dan status. Bahan memakai satuan dasar `g`, `ml`, atau `pcs`, dengan satuan pembelian dan faktor konversi. Status: Aman, Menipis, Habis. Riwayat mutasi menunjukkan tanggal, jenis, jumlah +/- , alasan/referensi, dan pengguna. Penyesuaian/waste wajib memiliki alasan.

### Pembelian/restock
Tanggal, pemasok opsional, bahan, jumlah dalam satuan pembelian, biaya per satuan, total, catatan, dan preview konversi ke satuan dasar. Konfirmasi memperbarui stok dan biaya rata-rata secara atomik. Pembelian stok memengaruhi arus kas/persediaan, bukan langsung dikurangkan lagi dari laba.

### Menu & resep
CRUD produk, ukuran, harga, add-on, dan resep tiap varian. Tampilkan status Resep lengkap/Belum lengkap. Jangan mengisi takaran resep dengan angka karangan. Perubahan harga/resep tidak boleh mengubah snapshot transaksi lama.

### Pengeluaran
Kategori, tanggal, nominal, metode bayar, catatan, pembuat. Kategori awal: transportasi, listrik/air, promosi, perlengkapan non-stok, biaya platform, lainnya. Pembelian bahan baku harus melalui modul pembelian stok agar tidak tercatat dua kali. Edit/hapus terbatas Admin dan diaudit.

### Laporan
Filter hari ini, kemarin, 7 hari, bulan ini, bulan lalu, rentang tanggal. Tampilkan omzet kotor, diskon, omzet bersih, transaksi, cup/porsi, HPP estimasi, laba kotor estimasi, pengeluaran operasional, laba operasional estimasi. Pisahkan laporan arus kas: pembayaran penjualan diterima, pembelian stok dibayar, biaya operasional dibayar, arus kas bersih. Rincian metode pembayaran, produk/ukuran, jam ramai, bahan terpakai, pembelian, waste, dan stok akhir. Export CSV mengikuti filter/timezone layar.

### Pengguna/pengaturan
Admin mengundang user melalui email, memilih Admin/Kasir, dan menonaktifkan akun tanpa menghapus histori. Pengaturan mencakup nama bisnis, timezone `Asia/Jakarta`, format struk, metode pembayaran, dan URL Instagram opsional yang kosong sampai diisi pemilik.

## 7. Interaksi dan motion
- Transisi halaman/panel 150–220 ms, transform kecil dan opacity.
- Gunakan Framer Motion (`motion`) hanya untuk transisi yang membantu workflow; hindari animasi panjang dan efek scroll GSAP dekoratif.
- Hormati `prefers-reduced-motion`.
- Modal dapat ditutup dengan tombol jelas/Escape dan mengelola fokus.
- Toast untuk hasil singkat; error form muncul dekat field.
- Jangan tampilkan sukses optimistis sebelum database mengonfirmasi commit.
- Aksi destruktif perlu konfirmasi; pembatalan transaksi/stok juga memerlukan alasan.

## 8. Komponen inti
`AppShell`, `DesktopSidebar`, `MobileBottomNav`, `PageHeader`, `KpiCard`, `ChartCard`, `StatusBadge`, `ConnectionStatus`, `MoneyText`, `DateRangeFilter`, `SearchInput`, `ProductCard`, `VariantSelector`, `AddonSelector`, `CartPanel`, `CheckoutSheet`, `ReceiptView`, `IngredientList`, `StockMovementList`, `DataTable`, `EmptyState`, `ErrorState`, `LoadingSkeleton`, `ConfirmDialog`, `FormField`, `Toast`.

`RoleGate` hanya helper UX; otorisasi sebenarnya wajib dilakukan server/database.

## 9. Accessibility dan quality bar
- Semua input punya label; placeholder bukan satu-satunya label.
- Tombol ikon punya accessible name dan fokus keyboard terlihat.
- Gunakan semantik heading, `button` untuk aksi, `a` untuk navigasi, dan dialog yang accessible.
- Pastikan kontras teks cukup, error tidak hanya dibedakan lewat warna, dan layout tetap berfungsi dengan zoom.
- Cek iPhone/Android viewport, keyboard virtual, safe area, serta ukuran layar 320 px sampai desktop.
- Loading, empty, error, offline, dan unauthorized states harus dirancang, bukan dibiarkan kosong.
