# MAGIPOS — Audit Total & Super Final Prompt untuk Antigravity

> **Tujuan dokumen:** audit dan memperbaiki MagiPOS/NyeniPOS secara menyeluruh, terutama alur kasir dari pemilihan produk sampai pembayaran manual, penyimpanan transaksi, stok, HPP, laporan, keamanan, dan UX mobile.
>
> **Repository:** https://github.com/Yoshput/magipos  
> **Aplikasi live:** https://magipos.vercel.app/pos  
> **Model eksekusi yang diinginkan:** Gemini 3.8 Flash High di Antigravity jika tersedia. Jika tidak tersedia, gunakan model coding agent terbaik yang tersedia.
>
> **PENTING:** Pembayaran di aplikasi adalah **pencatatan pembayaran manual**, bukan integrasi payment gateway. Pertahankan QRIS statis GoPay Merchant dan informasi rekening blu by BCA yang memang sudah ada di repository. Jangan menambahkan Midtrans, Xendit, Stripe, payment API, dynamic QR, webhook gateway, atau mengklaim pembayaran otomatis terverifikasi.

---

# BAGIAN A — TEMUAN AUDIT AWAL

Temuan di bawah berasal dari pemeriksaan statis file yang tersedia di repository GitHub. Mulai ulang dengan membaca kode terkini di workspace Antigravity dan verifikasi semua temuan sebelum mengubah implementasi. Jangan menganggap audit awal ini menggantikan inspeksi workspace.

## A1. Alur POS dan UX

1. `src/app/pos/page.tsx` menampilkan katalog, modal varian, keranjang desktop, keranjang mobile, modal checkout, dan struk.
2. `src/features/pos/VariantSelectorModal.tsx` menambahkan item ke cart lalu menutup modal. Pada layar mobile, kasir harus membuka keranjang terlebih dahulu lalu menekan **Bayar**. Alurnya tidak cukup eksplisit dan bisa terasa seperti berhenti di pemilihan produk.
3. `VariantSelectorModal.tsx` menolak tambah ke keranjang jika resep varian kosong. Pesan kesalahan berupa alert, bukan status inline yang bisa ditindaklanjuti. Kasir tidak seharusnya dibuat bingung antara memilih produk dan mengonfigurasi resep.
4. State pemilihan add-on pada modal perlu di-reset saat modal dibuka untuk produk/sesi baru, agar pilihan produk sebelumnya tidak terbawa tanpa sengaja.
5. Pastikan CTA keranjang selalu terlihat setelah item berhasil ditambahkan pada mobile, tidak tertutup bottom navigation/safe area, dan memberi pilihan **Buka Keranjang** atau **Lanjut Pilih Menu**.
6. Jangan otomatis menyelesaikan pembayaran hanya karena kasir menekan **Tambah Keranjang**. Tombol itu menambahkan item saja. Checkout harus menjadi langkah terpisah yang jelas.

## A2. Kontradiksi arsitektur dan persistensi

1. `README.md` menjelaskan database `localStorage` per browser tanpa database eksternal.
2. `ANTIGRAVITY_PROMPT.md`, `prd.md`, dan `agent.md` menjelaskan target Supabase Auth, PostgreSQL, RLS, validasi server/database, serta transaksi atomik.
3. Implementasi `src/lib/storage/local-db.ts` yang diperiksa masih menggunakan `localStorage` sebagai penyimpanan utama. Data admin dan kasir pada perangkat/browser berbeda tidak otomatis menjadi satu database bersama.
4. `localDb.saveDb()` menangkap error penyimpanan dan hanya mencatatnya ke console. Pemanggil dapat melanjutkan seolah-olah data sudah berhasil tersimpan.
5. `getDb()` mengembalikan data default ketika parsing gagal, dan migrasi schema data lama belum memiliki strategi versioned migration yang cukup kuat.
6. Ada dependensi Supabase di `package.json`, tetapi dokumentasi dan implementasi aktual belum satu arah.

**Keputusan target produksi:** gunakan Supabase Auth + PostgreSQL + RLS sebagai sumber data bersama, sesuai PRD/agent, karena aplikasi memiliki role Admin/Kasir, stok, transaksi, dan laporan yang harus konsisten lintas perangkat. `localStorage` boleh digunakan untuk preferensi UI atau draft cart, tetapi bukan sumber kebenaran transaksi produksi. Jika environment Supabase belum tersedia, tampilkan setup/error yang jelas; jangan diam-diam menganggap localStorage sebagai database produksi. Jika tetap menyediakan demo lokal, pisahkan secara eksplisit, beri label DEMO/LOCAL ONLY, dan jangan mencampurnya dengan data produksi.

## A3. Resep, stok, dan HPP

1. `src/lib/storage/local-db.ts` memuat seed takaran resep contoh. PRD/agent menyatakan takaran resep aktual belum diberikan dan tidak boleh ditebak.
2. Takaran resep contoh harus dianggap **belum terverifikasi** sampai Admin mengonfirmasi takaran yang benar. Jangan gunakan takaran tebakan untuk menghitung HPP/laba produksi.
3. Proses penjualan yang diperiksa menghitung konsumsi stok berdasarkan resep varian, tetapi belum menghitung resep bahan untuk add-on Mix Fruit.
4. `SaleItem` menyimpan `unit_cogs_idr` dan `line_cogs_idr` sebagai nol, meskipun total COGS dihitung di level transaksi. Hal ini merusak analisis HPP/margin per produk.
5. Detail add-on yang disimpan tidak konsisten untuk jumlah cup lebih dari satu: total add-on harus memperhitungkan kuantitas add-on per cup dikalikan kuantitas item induk.
6. Jangan pernah menganggap HPP nol jika resep/biaya belum lengkap. Simpan status HPP sebagai **belum tersedia/tidak terverifikasi**, dan keluarkan dari metrik laba yang memerlukan HPP valid.
7. Pilihan produk dan penambahan ke cart jangan diblokir hanya karena resep belum lengkap. Jika tracking stok aktif untuk varian tersebut, checkout harus menjelaskan dan memblokir transaksi dengan pesan yang actionable sampai resep/stok valid. Jika Admin secara eksplisit menonaktifkan tracking stok untuk varian, penjualan boleh dicatat tanpa pengurangan stok, tetapi HPP harus ditandai belum diketahui dan tidak boleh dianggap nol.

## A4. Pembayaran manual

1. `src/features/pos/CheckoutModal.tsx` sudah memiliki pilihan Cash, QRIS, dan Transfer, termasuk tampilan QRIS statis serta detail transfer yang sudah ada di repository.
2. Checkout yang diperiksa langsung menyimpan transaksi dengan status `completed` setelah tombol konfirmasi ditekan. QRIS reference opsional dan tidak ada kontrol wajib yang memastikan kasir telah memeriksa pembayaran masuk. Transfer juga membutuhkan pencatatan referensi/catatan yang lebih baik.
3. Jangan membuat integrasi gateway. Pembayaran QRIS harus diverifikasi kasir secara manual lewat notifikasi/riwayat GoPay Merchant/GoBiz; transfer harus diverifikasi lewat mutasi rekening blu by BCA.
4. Untuk QRIS dan transfer, sebelum commit final wajib ada checkbox/konfirmasi eksplisit, misalnya **“Saya sudah memeriksa dan memastikan pembayaran masuk.”** Nomor referensi/bukti dapat dicatat jika tersedia, tetapi bukan pengganti verifikasi manual.
5. Cash harus memvalidasi uang diterima >= total, menghitung kembalian, dan menyimpan uang yang diserahkan, nilai penjualan, serta kembalian sebagai data terpisah.
6. Data rekening dan gambar QRIS harus memakai aset/informasi yang sudah ada. Jangan mengarang, mengganti, atau mengubah detail rekening/QR. Jadikan konfigurasi mudah dikelola Admin jika aman, dengan mempertahankan nilai eksisting saat migrasi.

## A5. Integritas transaksi dan keamanan

1. `createSale()` menerima total, diskon, harga item, dan line total dari sisi client. Untuk produksi, server/database harus menghitung ulang total berdasarkan harga aktif dan data produk tepercaya.
2. Gunakan transaksi database atomik untuk menyimpan penjualan, item, add-on, snapshot harga/HPP, payment record, inventory movements, dan pengurangan stok.
3. Gunakan idempotency key unik yang divalidasi di database agar double-click/retry tidak membuat transaksi ganda.
4. Kode yang diperiksa memiliki kredensial demo hardcoded dan cookie sesi JSON yang ditulis dari JavaScript. Middleware membaca role dari cookie tersebut; ini bukan autentikasi server yang aman untuk produksi.
5. Jangan mengandalkan penyembunyian menu atau validasi client untuk RBAC. Server/database wajib memvalidasi sesi, akun aktif, role, dan izin pada setiap operasi sensitif.
6. Jangan pernah mengekspos `SUPABASE_SERVICE_ROLE_KEY` atau secret lain di client bundle, Git, log, atau dokumentasi publik.
7. Perubahan schema/arsitektur tidak boleh menghapus transaksi yang sudah tersimpan di browser pengguna. Buat backup/migrasi dengan preview dan validasi. Jangan melakukan reset otomatis.

---

# BAGIAN B — PROMPT EKSEKUSI UTAMA

Salin mulai dari baris berikut sampai akhir dokumen ini ke Antigravity setelah membuka workspace repository `Yoshput/magipos`.

---

## PERAN DAN MISI

Kamu adalah tim senior yang terdiri dari Staff Full-Stack Engineer, POS/Product Designer, Database Engineer, Security Engineer, Finance/Inventory Domain Specialist, dan QA Automation Engineer.

Tugasmu adalah melakukan **audit total, memperbaiki akar masalah, mengimplementasikan perbaikan, dan memverifikasi** aplikasi MagiPOS/NyeniPOS di workspace saat ini. Ini bukan tugas membuat mockup atau hanya memberi rekomendasi. Teruskan sampai perubahan kode dan pengujian yang dapat dilakukan benar-benar selesai.

Model yang diinginkan: Gemini 3.8 Flash High jika tersedia. Gunakan kemampuan coding agent, terminal, browser, dan test tools yang tersedia. Jangan mengarang hasil pengujian.

## 1. ATURAN NON-NEGOTIABLE

1. Baca `README.md`, `prd.md`, `design.md`, `agent.md`, `ANTIGRAVITY_PROMPT.md`, `package.json`, semua source POS/cart/checkout/storage/auth, seluruh tests, dan daftar aset. Baca seluruh file relevan sebelum membuat perubahan.
2. Audit keadaan workspace dan `git status` terlebih dahulu. Jangan menghapus atau menimpa perubahan lokal pengguna yang belum di-commit. Buat rencana singkat, lalu langsung implementasikan tanpa menunggu persetujuan untuk detail yang sudah ditetapkan dalam prompt ini.
3. Jangan berhenti setelah membuat rencana, audit, wireframe, atau TODO. Implementasikan perbaikannya, jalankan tes, perbaiki error, dan laporkan sisa blocker secara jujur.
4. Jangan mengganti brand, logo, foto produk, gambar QRIS, detail rekening, harga yang sudah benar, atau fitur bisnis tanpa alasan teknis yang jelas. Pertahankan aset yang ada.
5. Jangan membuat payment gateway. Tidak ada Midtrans, Xendit, Stripe, payment API, dynamic QR, webhook gateway, atau verifikasi bank otomatis.
6. QRIS GoPay Merchant adalah **QRIS statis** dari aset yang sudah ada di repo. Transfer adalah **transfer manual ke blu by BCA** dengan informasi rekening yang sudah ada di repo. UI hanya membantu kasir menampilkan instruksi, mencatat referensi, dan mengonfirmasi verifikasi manual.
7. Jangan menebak resep, biaya bahan, identitas pemilik rekening, atau detail bisnis. Pertahankan nilai konfigurasi yang sudah ada dan minta Admin mengonfirmasi data yang belum terverifikasi melalui setup aplikasi, bukan dengan mengarang nilai.
8. Jangan mengklaim build/test/E2E/deploy berhasil jika tidak benar-benar dijalankan. Jangan deploy atau push ke production tanpa izin eksplisit.
9. Uang disimpan sebagai integer Rupiah. Jangan menggunakan floating point untuk nominal uang.
10. Bahasa UI Indonesia, timezone `Asia/Jakarta`, format Rupiah konsisten, dan mobile-first.
11. Semua tombol, form, tab, filter, modal, dan navigasi yang ditampilkan harus memiliki fungsi nyata. Tidak boleh ada tombol dummy.
12. Jangan membuat fallback diam-diam dari database produksi ke localStorage/demo.

## 2. TUJUAN PRODUK DAN ALUR KASIR

Alur utama yang harus mudah dipahami kasir:

1. **Pilih produk** dari katalog/pencarian.
2. **Pilih varian** 200/300/400/500 ml dan add-on opsional Mix Fruit.
3. **Tambah ke keranjang** dengan feedback sukses yang jelas.
4. **Review keranjang**: produk, varian, add-on per cup, jumlah, hapus item, subtotal, diskon jika diizinkan, dan total.
5. **Checkout** dengan metode pembayaran Cash, QRIS GoPay Merchant (statis), atau Transfer blu by BCA.
6. **Verifikasi/catat pembayaran manual** sesuai metode.
7. **Commit transaksi** ke database secara atomik.
8. **Tampilkan struk/nomor transaksi** hanya setelah commit berhasil.
9. **Perbarui riwayat, stok, HPP, dashboard, dan laporan** berdasarkan transaksi yang benar-benar tersimpan.

### Aturan UX

- Tombol `Tambah Keranjang` hanya menambahkan item, bukan langsung menyelesaikan pembayaran.
- Setelah item ditambahkan, tutup modal varian dan tampilkan toast/banner: “Produk ditambahkan ke keranjang”, dengan CTA **Buka Keranjang** dan opsi **Lanjut Pilih Menu**.
- Pada mobile, tampilkan sticky cart bar yang selalu terlihat saat cart berisi item: jumlah cup/item, total tagihan, dan tombol **Buka Keranjang**. Jangan tertutup bottom navigation, keyboard, atau safe area.
- Di keranjang, tombol utama harus jelas: **Lanjut ke Pembayaran — Rp [total]**. Tombol nonaktif hanya jika keranjang kosong atau ada kondisi validasi yang benar-benar mencegah checkout.
- Saat checkout dibuka, tampilkan ringkasan pesanan, total akhir, metode pembayaran, input yang relevan, status validasi, dan tombol konfirmasi.
- Sediakan tombol kembali ke keranjang tanpa kehilangan item/kuantitas/add-on.
- Reset state modal varian/add-on ketika modal dibuka untuk sesi/produk baru; jangan membawa pilihan add-on sebelumnya tanpa sengaja.
- Tangani loading, error, empty state, offline, session expired, dan permission denied dengan bahasa yang jelas.
- Jangan tampilkan sukses sebelum database mengonfirmasi commit.
- Pastikan layout nyaman pada lebar 320, 360, 375, 390, tablet, dan desktop. Tombol sentuh minimal sekitar 44 px dan tidak ada horizontal overflow.
- Hormati `prefers-reduced-motion` dan jangan menambah animasi berat.

## 3. PILIHAN ARSITEKTUR DAN DATA

Gunakan arsitektur produksi sesuai PRD/agent: **Next.js App Router + TypeScript strict + Supabase Auth + PostgreSQL + RLS + Vercel**.

- Supabase/PostgreSQL adalah sumber kebenaran untuk data produksi yang harus dipakai bersama: akun, produk, harga, resep, bahan, stok, penjualan, pembayaran, pembelian, pengeluaran, mutasi stok, audit log, dan laporan.
- `localStorage` hanya boleh menyimpan preferensi UI, draft keranjang sementara, atau cache yang tidak menjadi sumber kebenaran transaksi.
- Jika Supabase belum dikonfigurasi, tampilkan halaman setup yang jelas dengan nama env yang diperlukan. Jangan diam-diam memakai data lokal sebagai database produksi.
- Bila demo/local-only mode dipertahankan, pisahkan dari production, beri label DEMO/LOCAL ONLY yang mencolok, jangan gunakan data demo untuk laporan produksi, dan jelaskan bahwa data tidak tersinkron antar perangkat.
- Gunakan migration SQL berurutan, foreign keys, check constraints, unique constraints, indexes, RLS policies, serta fungsi/RPC database untuk operasi kritis.
- Gunakan server-side auth/route handler/server action yang memvalidasi session, akun aktif, role, payload, dan izin. Jangan percaya role dari client/localStorage/cookie JSON unsigned.
- `SUPABASE_SERVICE_ROLE_KEY` hanya boleh berada di server. Jangan commit secret.
- Nonaktifkan public signup. Admin awal harus dibuat melalui prosedur bootstrap aman yang didokumentasikan; jangan menggunakan password default yang aktif di production.
- Gunakan Zod atau validasi server setara untuk semua input.
- Jangan membuat ulang seluruh aplikasi dari nol jika komponen yang ada bisa diperbaiki. Refactor bertahap dan modular; pertahankan fitur yang sudah berfungsi.

### Skema domain minimal yang perlu diaudit/dilengkapi

Sesuaikan dengan schema yang sudah ada, jangan membuat tabel duplikat tanpa alasan.

- `profiles` / users dan role.
- `products`, `product_variants`, `addons`.
- `ingredients`.
- `variant_recipe_items` dan **`addon_recipe_items`**.
- `sales`, `sale_items`, `sale_item_addons`.
- payment record atau kolom payment yang setara dengan metode, status, referensi, nominal, waktu, dan petugas verifikasi.
- `inventory_movements` append-only.
- `stock_purchases`, `stock_purchase_items`.
- `expenses`.
- `business_settings` termasuk metode pembayaran dan instruksi pembayaran.
- `audit_logs`.
- `idempotency_keys` atau unique idempotency key pada transaksi.

Jangan memaksakan tabel terpisah jika desain saat ini dapat menyimpan informasi yang sama secara konsisten; yang penting integritas data dan audit trail.

## 4. ATURAN PEMBAYARAN MANUAL

### A. Cash / Tunai

- Tampilkan total akhir.
- Input `Uang Diterima` dengan tombol cepat Uang Pas, Rp20.000, Rp50.000, Rp100.000, dan opsi lain yang masuk akal.
- Validasi nominal adalah bilangan Rupiah valid dan `uang_diterima >= total`.
- `kembalian = uang_diterima - total`.
- Jika uang kurang, tombol konfirmasi nonaktif dan pesan kekurangan terlihat jelas.
- Catat nilai penjualan, uang yang diserahkan, kembalian, metode `cash`, kasir, waktu, dan nomor transaksi.
- Untuk arus kas/laci, uang penjualan yang masuk laci adalah total penjualan, bukan nominal tender sebelum kembalian.

### B. QRIS GoPay Merchant — statis

- Gunakan **gambar QRIS yang sudah ada** di repository; jangan membuat QR baru, jangan mengganti gambar, dan jangan menganggapnya dynamic QR.
- Tampilkan nominal tagihan secara jelas.
- Berikan instruksi untuk pelanggan scan QRIS dan untuk kasir mengecek pembayaran masuk melalui GoPay Merchant/GoBiz secara manual.
- Field referensi transaksi GoBiz/QRIS boleh opsional jika memang tidak selalu tersedia.
- Wajib ada konfirmasi eksplisit dari kasir, misalnya checkbox: **“Saya sudah memeriksa notifikasi/riwayat GoPay Merchant dan memastikan pembayaran sebesar total tagihan sudah masuk.”**
- Jangan mengizinkan commit final sebelum checkbox tercentang.
- Catat metode `qris`, status pembayaran, petugas yang memverifikasi, waktu verifikasi, referensi/catatan jika ada, dan total pembayaran.
- Jangan mengklaim sistem memverifikasi QRIS otomatis. Verifikasi dilakukan manusia.
- Jangan memasukkan nominal tender QRIS ke kas tunai/laci.

### C. Transfer blu by BCA

- Pertahankan nama bank, nomor rekening, nama pemilik, dan instruksi yang saat ini ada di repository. Jangan mengarang atau mengubah nilainya.
- Tampilkan tombol salin nomor rekening yang berfungsi dan feedback copy yang benar.
- Tampilkan total yang harus ditransfer.
- Berikan field referensi/berita transfer dan catatan opsional.
- Wajib ada konfirmasi eksplisit: **“Saya sudah memeriksa mutasi rekening blu by BCA dan memastikan transfer sebesar total tagihan sudah masuk.”**
- Jangan mengizinkan commit final sebelum konfirmasi tersebut.
- Catat metode `transfer`, status, petugas verifikasi, waktu verifikasi, referensi/catatan jika ada, dan total pembayaran.
- Jangan mengklaim aplikasi mengecek mutasi bank otomatis. Ini pencatatan manual.
- Transfer bukan kas masuk laci; laporkan terpisah dari tunai.

### Aturan umum pembayaran

- Jangan menyimpan transaksi QRIS/transfer sebagai `paid/completed` hanya karena metode dipilih. Hanya commit setelah kasir mengonfirmasi verifikasi manual.
- Untuk versi MVP, transaksi yang belum dibayar tidak boleh mengurangi stok atau menambah omzet. Jika status `pending` diimplementasikan, laporan harus mengecualikannya dari penjualan dibayar dan stok hanya dikurangi sesuai kebijakan yang terdokumentasi.
- Setelah pembayaran terverifikasi, status dan payment record disimpan konsisten dalam transaksi database yang sama.
- Jika penyimpanan gagal, tampilkan error dan pertahankan keranjang; jangan hapus cart dan jangan tampilkan struk sukses.
- Jika retry setelah timeout, gunakan idempotency key yang sama agar tidak membuat transaksi kedua.
- Jangan mencatat bukti pembayaran palsu atau menampilkan label “terverifikasi otomatis”.

## 5. KERANJANG, HARGA, ADD-ON, DAN DISKON

- Total line item harus konsisten:
  `line_total = (harga_varian + jumlah_harga_addon_per_cup) × kuantitas_cup`.
- Untuk contoh uji: varian Rp17.000 + Mix Fruit Rp2.000 per cup, kuantitas 2 cup, total baris = Rp38.000.
- Kuantitas add-on harus memiliki semantik yang jelas: jumlah add-on per cup atau total add-on. Saat menyimpan detail transaksi, line total add-on wajib memperhitungkan jumlah cup induk.
- Harga dan nama produk/varian/add-on harus disalin sebagai snapshot pada saat transaksi agar histori tidak berubah ketika Admin mengubah harga atau nama.
- Server/database menghitung ulang subtotal, diskon, dan total dari harga aktif yang tepercaya. Jangan percaya angka dari browser.
- Diskon tidak boleh negatif atau melebihi subtotal. Terapkan pembulatan Rupiah yang konsisten.
- Audit siapa yang memberi diskon. Jika kasir tidak berwenang memberi diskon manual, sembunyikan kontrolnya dan validasi lagi di server; jangan hanya menonaktifkan UI.
- Keranjang tidak boleh berubah diam-diam ketika metode pembayaran berubah.
- Jika cart kosong, checkout tidak bisa dibuka.
- Setelah transaksi sukses, bersihkan cart dan diskon hanya setelah commit sukses.

## 6. RESEP, STOK, ADD-ON, DAN HPP

### Resep belum terverifikasi

- Jangan menggunakan takaran seed tebakan sebagai data resep bisnis yang sah.
- Saat migrasi, tandai resep seed lama yang belum diverifikasi sebagai `needs_confirmation` atau status setara. Jangan menimpa resep nyata yang telah dimasukkan Admin.
- Pada instalasi baru, seed katalog dan harga yang diketahui saja; jangan mengarang takaran resep.
- Buat setup wizard Admin yang menunjukkan varian/add-on yang belum memiliki resep valid.
- Admin harus mengonfirmasi takaran aktual sebelum tracking stok/HPP diaktifkan untuk varian/add-on tersebut.
- Menambahkan produk ke keranjang tidak boleh diblokir hanya karena resep belum lengkap.
- Jika tracking stok diaktifkan tetapi resep belum valid atau stok tidak cukup, blokir commit dengan pesan yang jelas: varian mana, bahan apa, stok tersedia, dan kebutuhan.
- Jika Admin secara eksplisit memilih mode tanpa tracking stok untuk varian yang resepnya belum lengkap, penjualan boleh dicatat tetapi stok tidak dikurangi dan HPP/laba ditandai belum tersedia. Jangan menganggap HPP nol.

### Pengurangan stok atomik

- Gabungkan kebutuhan semua item dalam satu cart per bahan sebelum memeriksa stok; hindari dua item yang masing-masing lolos tetapi totalnya membuat stok negatif.
- Perhitungan kebutuhan resep varian: jumlah resep per porsi × jumlah cup.
- Perhitungan kebutuhan resep add-on: jumlah resep per add-on × kuantitas add-on per cup × jumlah cup induk.
- Validasi stok dan kurangi stok secara atomik di database. Stok tidak boleh negatif.
- Buat inventory movement append-only untuk setiap perubahan.
- Void tidak menghapus transaksi; void membalik inventory movements tepat satu kali.
- HPP per item harus dihitung dari snapshot resep dan biaya bahan pada saat transaksi. `sale.total_cogs` harus sama dengan jumlah COGS item yang valid.
- Jika satu item HPP belum diketahui, jangan memasukkan nilai nol seolah-olah gratis. Tandai HPP belum lengkap dan jangan memasukkan transaksi tersebut ke metrik laba yang mengasumsikan HPP lengkap.
- Perbarui HPP weighted average saat restock dengan formula yang benar, memakai satuan dasar dan konversi snapshot.
- Pisahkan laba rugi dari arus kas: pembelian bahan stok tidak boleh sekaligus dihitung sebagai biaya operasional dan HPP.
- Pastikan void mengembalikan stok dan koreksi hanya sekali, dengan alasan wajib dan audit log.

## 7. DATA, MIGRASI, DAN KESELAMATAN

- Sebelum mengubah storage, cek data yang mungkin sudah ada pada `localStorage` browser lama. Jangan menghapus atau menimpa data otomatis.
- Buat jalur migrasi terkontrol dari backup JSON lokal ke database produksi: hanya Admin, tampilkan preview jumlah record, validasi schema, deteksi duplikasi, validasi relasi, laporan error, dan transaksi import yang aman.
- Sediakan backup export sebelum migrasi dan dokumentasikan langkah rollback. Jangan meminta pengguna menempelkan password/secret di chat.
- Migrasi harus versioned dan idempotent.
- Jangan menggunakan `DEFAULT_DATABASE` sebagai fallback diam-diam saat database produksi gagal.
- Jangan pernah menyimpan password plaintext sebagai autentikasi produksi.
- Cookie sesi produksi harus dibuat dan diverifikasi secara server-side/oleh Supabase Auth; role tidak boleh dipercaya dari JSON unsigned yang bisa diedit client.
- Terapkan RLS pada semua tabel yang dapat diakses client. Kasir hanya boleh membuat transaksi, melihat transaksi yang diizinkan, dan membaca data yang diperlukan untuk menjual. Kasir tidak boleh mengubah harga/resep/stok/pengeluaran/role/settings atau membaca HPP/laba.
- Admin memiliki akses sesuai kebutuhan, tetapi operasi sensitif harus diaudit.
- Jangan menaruh service role key, credential, atau secret pada client.
- Semua error database harus ditampilkan secara jelas dan dicatat dengan aman tanpa membocorkan secret atau data sensitif.

## 8. LAPORAN DAN KEUANGAN

Laporan harus berasal dari data transaksi yang benar-benar tersimpan, bukan dummy/hardcoded.

- Omzet kotor, diskon, omzet bersih, transaksi dibayar, cup terjual.
- Total penjualan per metode pembayaran: cash, QRIS, transfer.
- Kas tunai masuk laci setelah kembalian, QRIS masuk non-tunai, transfer masuk non-tunai.
- HPP, laba kotor, biaya operasional, laba operasional hanya jika data HPP valid.
- Pembelian bahan, pengeluaran operasional, waste, penyesuaian stok, dan mutasi stok.
- Filter hari ini, kemarin, 7 hari terakhir, bulan ini, bulan lalu, dan rentang tanggal dengan timezone `Asia/Jakarta`.
- Void tidak dihitung sebagai omzet aktif; audit trail tetap dipertahankan.
- CSV mengikuti filter aktif, menggunakan escaping yang benar untuk koma, kutip, dan newline.
- Jangan menghitung uang diterima sebelum kembalian sebagai pendapatan.
- Jangan mengurangi pembelian stok dari laba operasional jika HPP bahan yang terpakai sudah dihitung; gunakan laporan arus kas terpisah.
- Jika data HPP tidak lengkap, tampilkan status data tidak lengkap, bukan angka laba yang menyesatkan.

## 9. KEAMANAN ROLE

Buat matriks izin yang diuji, bukan sekadar menyembunyikan menu.

**Kasir:**
- Login/logout.
- Melihat katalog, harga aktif, dan status ketersediaan yang diperlukan untuk menjual.
- Membuat transaksi dan mencatat konfirmasi pembayaran manual.
- Melihat riwayat transaksi sesuai izin, mencetak struk.
- Tidak dapat mengubah harga, resep, stok, pembelian, pengeluaran, role pengguna, settings, atau melihat HPP/laba.

**Admin:**
- Mengelola produk, harga, varian, add-on, resep, bahan, stok, pembelian, waste/penyesuaian, pengeluaran, user, pengaturan pembayaran, laporan, backup/import, void, dan audit log.
- Void wajib alasan; tidak boleh menghapus transaksi secara fisik.

Jangan gunakan kredensial bawaan di production. Jika kredensial demo dibutuhkan untuk development, aktifkan hanya di environment development dan pastikan tidak dapat digunakan pada production.

## 10. URUTAN WORKFLOW EKSEKUSI WAJIB

### Fase 0 — Inventarisasi dan reproduksi
1. Periksa branch, `git status`, struktur file, dependency, konfigurasi, aset, tests, dan dokumentasi.
2. Trace alur dari `ProductCard` → `VariantSelectorModal` → `CartContext` → `CartPanel` → `CheckoutModal` → storage/database → `ReceiptModal` → transaksi/laporan.
3. Identifikasi akar masalah berdasarkan kode aktual, bukan dugaan.
4. Periksa error browser/console dan log yang tersedia jika browser tool tersedia.
5. Buat `AUDIT_REPORT.md` dengan temuan severity P0/P1/P2, bukti file/line, dampak, dan perbaikan yang dilakukan/direncanakan.
6. Jangan berhenti di sini; lanjutkan implementasi.

### Fase 1 — Tetapkan arsitektur dan lindungi data
1. Rekonsiliasi `README.md`, `prd.md`, `agent.md`, `ANTIGRAVITY_PROMPT.md`, dan kode.
2. Terapkan Supabase/PostgreSQL sebagai sumber data produksi sesuai keputusan di atas.
3. Buat/benahi migration, schema, constraints, indexes, RLS, auth, dan fungsi transaksi.
4. Buat `.env.example` tanpa nilai secret dan panduan setup.
5. Buat strategi backup/import untuk data lokal lama. Jangan reset data pengguna.

### Fase 2 — Perbaiki alur POS
1. Perbaiki state modal produk/varian/add-on.
2. Pastikan tambah ke cart memberi feedback dan CTA yang jelas.
3. Perbaiki cart mobile dan desktop.
4. Pastikan kuantitas, add-on, diskon, subtotal, dan total konsisten.
5. Pastikan tombol checkout hanya aktif ketika syarat valid.
6. Perbaiki validasi resep/stok tanpa membuat kasir terjebak pada modal pemilihan produk.
7. Implementasikan checkout Cash, QRIS statis, dan Transfer manual sesuai aturan pembayaran.
8. Implementasikan manual verification, payment record, idempotency, commit atomik, dan receipt.
9. Pastikan kegagalan simpan mempertahankan cart dan tidak menampilkan sukses palsu.

### Fase 3 — Integritas inventori dan keuangan
1. Tambahkan recipe untuk add-on dan hitung konsumsi bahan yang benar.
2. Hapus asumsi bahwa takaran seed adalah resep aktual; buat status konfirmasi Admin.
3. Simpan snapshot harga, resep, dan biaya pada transaksi.
4. Perbaiki HPP per item dan total transaksi.
5. Perbaiki weighted average cost, restock, waste, adjustment, void/reversal.
6. Cocokkan angka dashboard/laporan dengan sumber transaksi dan payment records.
7. Terapkan izin untuk diskon dan tindakan sensitif.

### Fase 4 — Security dan quality
1. Audit seluruh halaman dan operasi untuk role bypass, kredensial hardcoded, cookie/session tidak aman, dan secret.
2. Terapkan server-side auth/RLS.
3. Tambahkan validasi input server dan error handling.
4. Pastikan retry/double click tidak membuat transaksi ganda.
5. Pastikan laporan kas tunai terpisah dari QRIS/transfer.
6. Tambahkan loading/error/empty/offline/session-expired states.

### Fase 5 — QA otomatis dan manual
Jalankan seluruh tes yang tersedia. Tambahkan unit, integration, dan E2E tests yang diperlukan. Jika Playwright belum ada, pertimbangkan menambahkannya bila lingkungan memungkinkan. Minimal verifikasi skenario di bagian 11.

### Fase 6 — Dokumentasi dan laporan akhir
1. Perbarui README dan dokumen spesifikasi agar tidak saling bertentangan.
2. Sediakan setup Supabase, migrations/seed, environment variables, bootstrap Admin, backup/import, run lokal, test, dan deploy.
3. Berikan ringkasan file yang diubah, akar masalah yang ditemukan, hasil setiap tes, hasil build, status verifikasi UI, keterbatasan, dan langkah manual yang masih dibutuhkan.
4. Jangan push atau deploy ke production tanpa izin eksplisit.
5. Jangan mengklaim hal yang belum diverifikasi.

## 11. ACCEPTANCE TESTS — SEMUA HARUS DICOBA

### A. Alur dasar
1. Login sebagai Kasir.
2. Buka POS dan pilih Mango Sago ukuran 200 ml.
3. Tambahkan ke keranjang tanpa add-on.
4. Pastikan item muncul dan total Rp13.000.
5. Buka keranjang, ubah kuantitas, dan hapus item.
6. Checkout Cash: total Rp13.000, uang diterima Rp15.000, kembalian Rp2.000.
7. Konfirmasi, pastikan transaksi tersimpan satu kali, nomor transaksi/struk tampil, dan cart dibersihkan hanya setelah commit berhasil.

### B. Add-on dan kuantitas
1. Pilih varian Rp17.000 dengan Mix Fruit Rp2.000 per cup.
2. Satu cup harus berjumlah Rp19.000.
3. Dua cup harus berjumlah Rp38.000.
4. Detail add-on yang tersimpan juga harus merepresentasikan Rp4.000 untuk dua cup jika satu add-on dipilih per cup.
5. Buka modal produk lain setelah memilih add-on; pastikan add-on sebelumnya tidak ikut terpilih otomatis.

### C. Cash
1. Uang kurang harus diblokir dan memberi pesan jelas.
2. Uang pas menghasilkan kembalian Rp0.
3. Uang lebih menghitung kembalian dengan benar.
4. Nilai revenue dan kas masuk laci harus memakai total penjualan setelah kembalian, bukan nominal tender sebelum kembalian.

### D. QRIS statis
1. Gambar QRIS yang ada di repo tampil dengan benar.
2. Total tagihan terlihat jelas.
3. Tidak ada request ke payment gateway.
4. Konfirmasi tanpa checkbox verifikasi harus ditolak.
5. Setelah kasir menandai pembayaran telah dicek manual, transaksi dapat disimpan dan mencatat metode, verifier, waktu, serta referensi jika ada.
6. Laporan mencatatnya sebagai non-tunai, bukan kas laci.

### E. Transfer blu by BCA
1. Informasi rekening yang sudah ada tetap benar dan tombol salin berfungsi.
2. Konfirmasi tanpa checkbox verifikasi mutasi harus ditolak.
3. Setelah verifikasi manual, transaksi tersimpan dengan metode transfer dan referensi/catatan bila diisi.
4. Laporan tidak mencampurkan transfer dengan kas tunai.
5. Tidak ada klaim pemeriksaan mutasi otomatis.

### F. Recipe, stok, dan HPP
1. Produk tanpa resep tidak boleh gagal diam-diam di modal pemilihan.
2. Jika tracking stok aktif dan resep belum valid, checkout menampilkan alasan yang jelas dan tidak commit.
3. Jika tracking stok dimatikan secara eksplisit untuk varian, penjualan dapat dicatat tanpa pengurangan stok; HPP harus ditandai tidak tersedia.
4. Stok tidak boleh negatif.
5. Kebutuhan bahan digabung untuk semua item dalam cart.
6. Add-on mengonsumsi bahan sesuai resep add-on jika tracking diaktifkan.
7. HPP per item dan total transaksi harus cocok.
8. Resep lama yang belum diverifikasi tidak boleh dianggap resep produksi valid secara otomatis.
9. Void mengembalikan stok tepat satu kali.

### G. Idempotency dan kegagalan
1. Double-click tombol konfirmasi hanya menghasilkan satu transaksi.
2. Retry setelah timeout tidak menggandakan penjualan.
3. Jika database gagal, tidak ada pesan sukses, struk tidak muncul, dan cart tetap ada.
4. Jika sesi habis, pengguna diminta login ulang dengan pesan yang jelas.
5. Data transaksi tetap ada setelah reload dan dapat dilihat di perangkat lain setelah login karena menggunakan database bersama.

### H. Role dan laporan
1. Kasir tidak dapat mengakses atau memanggil operasi admin secara langsung.
2. Kasir tidak dapat mengubah harga/resep/stok/role atau melihat HPP/laba.
3. Admin dapat mengelola data dan void dengan alasan.
4. Transaksi void tidak dihitung sebagai omzet aktif, tetapi jejak audit tetap ada.
5. HPP yang belum valid tidak ditampilkan sebagai nol atau laba pasti.
6. Arus kas dan laba rugi terpisah dengan benar.
7. CSV mengikuti filter dan timezone `Asia/Jakarta`.

### I. Responsiveness
Uji setidaknya 320 px, 360 px, 375 px, 390 px, tablet, dan desktop. Pastikan modal, cart, checkout, keyboard, tombol konfirmasi, dan bottom navigation tidak saling menutupi.

## 12. PERINTAH VERIFIKASI

Periksa script yang benar-benar tersedia di `package.json`, lalu jalankan sesuai kebutuhan:

- install dependencies dengan package manager yang sesuai lockfile.
- lint.
- typecheck.
- unit tests.
- integration/E2E tests yang tersedia.
- production build.

Perbaiki semua error yang ditemukan. Jika suatu tes tidak dapat dijalankan karena keterbatasan environment, tulis alasan spesifik dan jangan mengklaim lulus. Bila browser tersedia, uji alur kasir end-to-end di viewport mobile dan desktop.

## 13. DEFINITION OF DONE

Pekerjaan hanya dapat dinyatakan selesai jika:

- [ ] Jalur pilih produk → cart → checkout → verifikasi pembayaran manual → transaksi tersimpan → struk berjalan.
- [ ] Cash, QRIS statis GoPay, dan transfer blu by BCA berjalan tanpa payment gateway.
- [ ] QRIS/transfer tidak dapat ditandai paid tanpa konfirmasi manual.
- [ ] Total, diskon, kembalian, add-on, HPP, stok, dan laporan konsisten.
- [ ] Tidak ada resep tebakan yang diam-diam dianggap data aktual.
- [ ] Transaksi dan stok atomik/idempotent; double click tidak menggandakan transaksi.
- [ ] Database produksi tersinkron antar perangkat dan dilindungi auth/RLS.
- [ ] Data lama tidak dihapus tanpa backup/migrasi yang jelas.
- [ ] Role Admin/Kasir benar-benar divalidasi server-side.
- [ ] UI mobile tidak overflow dan CTA kasir jelas.
- [ ] Lint, typecheck, tests, dan build telah dijalankan atau keterbatasannya dilaporkan.
- [ ] Dokumentasi setup/deploy konsisten dengan arsitektur aktual.
- [ ] Tidak ada tombol dummy, data demo produksi, secret terekspos, atau klaim sukses palsu.

## 14. FORMAT LAPORAN AKHIR WAJIB

Laporkan secara ringkas tetapi faktual:

1. **Root cause utama** mengapa alur kasir terasa berhenti atau tidak mencapai pembayaran.
2. **Temuan audit** berdasarkan severity P0/P1/P2.
3. **File yang diubah** dan ringkasan perubahan.
4. **Arsitektur akhir** serta keputusan yang diambil untuk menyelesaikan kontradiksi localStorage vs Supabase.
5. **Hasil skenario uji** dalam tabel PASS / FAIL / NOT RUN beserta alasannya.
6. Hasil lint, typecheck, unit tests, E2E tests, dan production build.
7. Status verifikasi UI mobile/desktop; jelaskan apa yang benar-benar diuji.
8. Langkah setup yang masih harus dilakukan Admin, termasuk nama environment variable saja (jangan meminta secret melalui chat).
9. Langkah menjalankan lokal dan deploy Vercel.
10. Risiko atau blocker tersisa. Jangan menyatakan selesai jika acceptance test kritis masih gagal.

**Mulai sekarang:** inspeksi workspace dan aset, verifikasi temuan audit, buat laporan audit singkat, lalu langsung implementasikan seluruh perbaikan yang dapat dikerjakan. Jangan berhenti pada rekomendasi atau rencana.
