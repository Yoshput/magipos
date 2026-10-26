# PROMPT UTAMA ANTIGRAVITY — NYENIPOS

Salin seluruh isi prompt ini ke Antigravity setelah membuka folder hasil ekstrak. Gunakan Gemini 3.8 Flash High jika model tersebut tersedia.

---

Kamu adalah senior full-stack engineer, product designer, database engineer, dan QA engineer. Tugasmu adalah membangun **NyeniPOS**, aplikasi kasir dan manajemen operasional untuk bisnis dessert cup **Mango Nyeni**.

## WAJIB BACA SEBELUM CODING
Baca seluruh dokumen berikut dan ikuti semuanya:
- `prd.md`
- `design.md`
- `agent.md`
- aset brand di folder `assets/`

Dokumen tersebut adalah spesifikasi produk. Jangan berhenti pada rencana, wireframe, dashboard dummy, atau scaffold. Lanjutkan sampai aplikasi benar-benar diimplementasikan dalam workspace.

## TUJUAN
Bangun web app full-stack yang siap dijalankan lokal dan dipersiapkan untuk deployment Vercel, dengan:
- Next.js App Router + TypeScript strict + Tailwind.
- Supabase Auth + PostgreSQL + Row Level Security.
- Vercel sebagai target deployment.
- Bahasa UI Indonesia, mata uang IDR, timezone `Asia/Jakarta`.
- Dua role: Admin dan Kasir/Operator.
- UI bergaya iOS yang clean, cepat, responsif, dan nyaman di Android, iPhone, tablet, Windows, Chrome, dan Safari.

## FITUR YANG HARUS BERFUNGSI
1. Login/logout dan proteksi role di server/database.
2. Dashboard dengan ringkasan omzet harian, jumlah transaksi, tren penjualan, stok menipis, serta metrik HPP/laba yang hanya terlihat Admin.
3. POS: katalog, pencarian, varian 200/300/400/500 ml, add-on, keranjang, quantity, Tunai/QRIS/Transfer, uang diterima/kembalian, konfirmasi, nomor transaksi, dan struk cetak.
4. Produk, varian, harga, add-on, dan editor resep.
5. Stok bahan: satuan dasar, satuan pembelian, konversi, stok awal, minimum stok, biaya rata-rata, mutasi, waste, penyesuaian, dan notifikasi stok rendah.
6. Pembelian/restock dengan penerimaan stok, perhitungan konversi, dan weighted average cost.
7. Pengeluaran operasional yang terpisah dari pembelian bahan.
8. Riwayat transaksi dan void khusus Admin dengan alasan wajib serta reversal stok idempotent.
9. Laporan harian, mingguan, bulanan, rentang tanggal, metode pembayaran, produk/ukuran, bahan terpakai, pembelian, waste, HPP estimasi, laba estimasi, dan arus kas terpisah.
10. Export CSV yang sesuai filter.
11. Manajemen user: undang dan nonaktifkan user, Admin saja.
12. Pengaturan bisnis, metode pembayaran, timezone, dan format struk.
13. PWA installable, print struk melalui browser, loading/empty/error/offline states.
14. Audit log untuk tindakan sensitif.

## HARGA SEED
Buat tiga produk: Dragon Sago, Mango Sago, Strawberry Sago. Untuk setiap produk, seed varian:
- 200 ml — Rp13.000
- 300 ml — Rp17.000
- 400 ml — Rp22.000
- 500 ml — Rp27.000
Add-on Mix Fruit: +Rp2.000 per cup.

Gunakan logo/foto dari `assets/` jika sesuai. Harga dapat diedit Admin. **Jangan mengarang takaran resep.** Karena takaran bahan belum diberikan, seed katalog/harga saja. Buat setup resep yang mengharuskan Admin mengisi takaran nyata; tandai resep belum lengkap dan cegah penjualan yang akan menghasilkan perhitungan stok palsu. URL Instagram belum diberikan, jadi field pengaturan boleh kosong; jangan membuat URL palsu.

## ATURAN DATA KRITIS
- Harga uang disimpan sebagai integer Rupiah.
- Semua perhitungan final, harga, role, recipe requirements, dan ketersediaan stok divalidasi server/database.
- Transaksi penjualan, item, snapshot HPP, inventory movements, dan pengurangan stok harus atomik.
- Gunakan idempotency key agar klik ganda/retry tidak menggandakan penjualan.
- Stok tidak boleh negatif.
- Simpan snapshot harga/nama/HPP agar histori tidak berubah saat produk diedit.
- Inventory movements append-only.
- Void tidak menghapus transaksi; void membalik stok tepat satu kali.
- Pisahkan laba dari arus kas. Pembelian stok tidak boleh dihitung ganda sebagai biaya operasional dan HPP.
- Aktifkan RLS pada semua tabel exposed. Kasir tidak boleh membaca data sensitif Admin atau mengubah inventori/pengaturan.
- Jangan pernah mengekspos `SUPABASE_SERVICE_ROLE_KEY` ke client. Jangan hardcode secret/password.
- Jika Supabase belum dikonfigurasi, tunjukkan setup/error yang jelas. Jangan diam-diam memakai localStorage atau data demo di production.

## DESAIN DAN INTERAKSI
Ikuti `design.md`: warna navy/biru dengan aksen mango, background terang, tipografi jelas, radius lembut, whitespace yang cukup, navigasi sidebar di desktop dan bottom navigation di mobile. POS harus cepat dipakai, dengan tombol sentuh besar dan checkout yang jelas. Semua tombol/filter/tab harus berfungsi. Gunakan animasi Framer Motion seperlunya, hormati `prefers-reduced-motion`, jangan menambahkan animasi berat yang memperlambat HP. Pastikan layout tidak overflow pada lebar 320 px.

## IMPLEMENTASI DAN VERIFIKASI
1. Periksa isi workspace dan aset dahulu.
2. Buat struktur project modular.
3. Buat migrations SQL lengkap, constraints, indexes, RLS policies, RPC/database functions, dan seed menu/harga.
4. Implementasikan workflow inti dari database sampai UI.
5. Buat `.env.example`, README setup, petunjuk bootstrap Admin, Supabase, dan Vercel.
6. Jalankan lint, typecheck, unit/integration tests yang tersedia, dan production build.
7. Perbaiki error yang ditemukan sebelum menyatakan selesai.
8. Periksa halaman utama pada mobile dan desktop bila browser tersedia. Jangan mengklaim verifikasi visual yang tidak dilakukan.
9. Jangan berhenti setelah membuat rencana atau halaman dashboard pertama. Kerjakan semua modul yang tercantum, lalu lakukan QA.
10. Jika ada hal yang membutuhkan akun/secret eksternal, siapkan kode dan dokumentasinya, lalu tulis langkah manual yang spesifik tanpa meminta secret dikirim melalui chat.

## DEFINITION OF DONE
Pekerjaan baru boleh dinyatakan selesai jika seluruh modul inti terimplementasi, database migrations dan RLS tersedia, alur penjualan dan stok aman, role diuji, laporan terhubung ke data nyata, responsive states dibuat, lint/typecheck/tests/build dijalankan, dan README/.env.example siap. Jika sebagian belum selesai, sebutkan dengan jujur dan lanjutkan pekerjaan yang masih dapat dilakukan.

Mulai dengan membaca dokumen dan memeriksa workspace. Setelah itu langsung implementasikan, jalankan verifikasi, perbaiki error, dan berikan laporan akhir beserta perintah run lokal dan langkah deploy Vercel.
