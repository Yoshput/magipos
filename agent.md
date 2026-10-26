# AGENT.md — NyeniPOS Implementation Contract

Dokumen ini wajib dibaca bersama `prd.md` dan `design.md` sebelum coding.

## 1. Misi dan prioritas
Bangun aplikasi NyeniPOS yang berfungsi end-to-end, bukan sekadar mockup, dashboard statis, atau scaffold. Implementasikan UI, autentikasi, izin, database migrations, transaksi, stok, laporan, pengujian, dan dokumentasi setup.

Urutan prioritas:
1. Integritas data, keamanan, dan aturan bisnis pada `prd.md`.
2. UX dan visual pada `design.md`.
3. Arsitektur dan standar kualitas pada dokumen ini.

Jangan mengarang takaran resep, credential, URL Instagram, atau data bisnis yang belum diberikan. Buat kolom/form yang dapat diisi Admin dan catat asumsi dalam README.

## 2. Stack yang disarankan
- Next.js App Router, React stabil yang kompatibel, TypeScript strict.
- Tailwind CSS dan komponen accessible (shadcn/ui atau setara).
- Supabase Auth + PostgreSQL + RLS.
- Vercel untuk deployment.
- `@supabase/ssr` untuk session/cookies Next.js.
- Zod untuk validasi input di server.
- React Hook Form bila berguna untuk form kompleks.
- `lucide-react` untuk ikon, Recharts untuk grafik, Framer Motion untuk animasi ringan.
- Vitest atau runner kompatibel untuk unit test; Playwright untuk alur kritis bila tersedia.
- Gunakan package manager yang tersedia dan simpan lockfile.

Gunakan dependency yang benar-benar diperlukan. Jangan memakai GSAP untuk animasi dekoratif yang tidak membantu workflow POS. Periksa dokumentasi API versi dependency yang dipilih.

## 3. Alur kerja wajib
1. Periksa file project dan aset yang tersedia.
2. Baca seluruh `prd.md`, `design.md`, dan `agent.md`.
3. Susun rencana singkat lalu implementasikan tanpa meminta konfirmasi untuk detail yang sudah ditetapkan.
4. Bangun app shell, design tokens, auth, dan proteksi route.
5. Buat SQL migrations, constraints, RLS, database functions/RPC, serta seed harga.
6. Implementasikan alur bahan/resep → POS → pengurangan stok → transaksi → laporan.
7. Implementasikan restock, waste/penyesuaian, pengeluaran, pengguna, audit log, CSV, dan struk.
8. Tambahkan loading, empty, error, offline, dan permission states.
9. Jalankan lint, typecheck, tests, dan production build.
10. Perbaiki error yang ditemukan, jangan hanya melaporkannya.
11. Periksa tampilan mobile dan desktop; perbaiki overflow, focus, dan touch targets.
12. Lengkapi README, `.env.example`, setup Supabase, bootstrap Admin, migrations, seed, dan deployment Vercel.

Jika browser atau tool verifikasi tidak tersedia, lakukan pemeriksaan lain yang dapat dilakukan dan sebutkan keterbatasannya. Jangan mengklaim test yang belum dijalankan.

## 4. Struktur kode
Gunakan struktur modular yang masuk akal, misalnya:
- `app/` untuk route dan layout.
- `components/` untuk UI reusable.
- `features/pos`, `features/inventory`, `features/reports`, `features/products`, `features/expenses`, `features/users` untuk domain.
- `lib/supabase/` untuk server/browser clients.
- `lib/validation/`, `lib/format/`, `lib/permissions/` untuk helpers.
- `supabase/migrations/`, `supabase/seed.sql`, `tests/`, `public/`.

Jangan menaruh seluruh aplikasi dalam satu komponen besar. Jangan menggandakan logika harga, stok, atau laporan pada banyak komponen.

## 5. Data integrity
- Nominal uang disimpan sebagai integer Rupiah; jangan gunakan floating point untuk uang.
- Kuantitas resep/stok disimpan sebagai numeric/decimal dalam satuan dasar yang konsisten.
- Semua laporan memakai timezone `Asia/Jakarta`.
- Simpan snapshot nama produk, varian, harga, dan HPP pada transaksi agar histori stabil.
- Hitung total, harga aktif, resep, stok, dan izin di server/database; jangan percaya nilai total dari browser.
- Gunakan idempotency key unik pada submit transaksi.
- Periksa total kebutuhan semua item dalam keranjang sebelum commit agar bahan yang sama tidak menyebabkan stok negatif.
- Penjualan, snapshot HPP, inventory movements, dan pengurangan stok harus atomik melalui PostgreSQL RPC/function atau transaksi setara.
- Inventory movement append-only; koreksi dilakukan dengan movement baru.
- Void harus idempotent dan mengembalikan stok tepat satu kali.
- Hitung weighted average cost secara atomik ketika stok masuk.
- Seed hanya produk, varian, harga, dan add-on yang diketahui. Jangan seed resep dengan takaran tebakan.
- Jika resep belum lengkap atau stok tidak cukup, tolak transaksi dan tampilkan pesan yang mudah dipahami.

## 6. Keamanan wajib
- Jangan pernah mengekspos `SUPABASE_SERVICE_ROLE_KEY`, token, password, atau secret ke browser, Git, log, atau dokumentasi publik.
- Aktifkan RLS pada semua tabel yang terekspos.
- Server actions/route handlers harus memvalidasi session, status akun, role, payload Zod, dan permission.
- Kasir tidak boleh mengubah harga, resep, stok, pengeluaran, user role, settings, atau melihat margin/HPP.
- Gunakan least privilege; hindari policy RLS terbuka untuk data sensitif.
- Fungsi `SECURITY DEFINER` wajib memverifikasi `auth.uid()` dan role aktif, memakai `search_path` aman, serta membatasi hak `EXECUTE`.
- Jangan gunakan `user_metadata` yang bisa diedit user sebagai sumber otorisasi.
- Tidak ada public sign-up dan tidak ada password admin hardcoded.
- Production tanpa konfigurasi Supabase harus menampilkan error jelas, bukan otomatis beralih ke localStorage/demo.
- Jika demo mode dibuat, hanya untuk development, diberi label DEMO, dan dinonaktifkan di production.

## 7. UX dan kualitas
- Ikuti `design.md`, mobile-first, dan utamakan kecepatan kasir.
- Semua tombol, tab, filter, dan kontrol harus memiliki aksi nyata.
- Jangan menampilkan transaksi sukses sebelum database mengonfirmasi commit.
- Sediakan skeleton/loading, empty, error, retry aman, offline, dan unauthorized states.
- Input memiliki label, validasi dekat field, keyboard navigation, dan focus ring.
- Jangan mengandalkan warna saja untuk status.
- Hormati `prefers-reduced-motion`.
- Jangan memakai data hardcoded pada dashboard production.
- Hindari `any` dan lint-disable massal untuk menyembunyikan error.
- CSV harus meng-escape nilai berisi koma, quote, atau newline.
- Format uang/tanggal konsisten dan locale-aware.

## 8. Supabase dan deployment
- Buat `.env.example` dengan nama variabel tanpa nilai secret.
- Minimal: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Jika fitur undangan memakai Admin API, `SUPABASE_SERVICE_ROLE_KEY` hanya di server.
- Sediakan migrations berurutan, seed SQL, RLS, indexes, constraints, RPC functions, dan petunjuk menjalankannya.
- Dokumentasikan membuat project Supabase, mematikan signup publik, membuat Admin awal, mengatur URL redirect auth, mengisi environment variables di Vercel, menjalankan migration, dan deploy.
- Pastikan tidak ada secret yang ter-commit.

## 9. Checklist selesai
- [ ] Login/logout dan proteksi route berjalan.
- [ ] Admin dan Kasir punya izin berbeda di server/database.
- [ ] Seed menu/harga sesuai poster dan dapat diedit.
- [ ] Resep belum lengkap ditandai dan tidak mengurangi stok secara keliru.
- [ ] Penjualan atomik, idempotent, dan kembalian benar.
- [ ] Stok, pembelian, waste, penyesuaian, dan void memiliki inventory movements.
- [ ] HPP/laba dan arus kas dihitung terpisah.
- [ ] Filter harian/bulanan dan CSV sesuai data.
- [ ] Tidak ada kontrol palsu atau data dummy production.
- [ ] UI mobile/desktop tidak overflow pada lebar 320 px.
- [ ] Lint, typecheck, tests, dan production build sudah dijalankan.
- [ ] README dan `.env.example` lengkap.

## 10. Format laporan akhir agen
Laporkan: (1) fitur yang benar-benar selesai, (2) keputusan teknis utama, (3) perintah verifikasi yang dijalankan dan hasilnya, (4) langkah Supabase yang masih perlu dilakukan pengguna, (5) nama environment variables yang harus diisi—jangan meminta secret dikirim lewat chat, (6) cara menjalankan lokal dan deploy Vercel, serta (7) keterbatasan yang masih tersisa. Jangan mengklaim pekerjaan yang belum dilakukan.
