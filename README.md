# Rekap TEKAD 2026

Aplikasi React + Express untuk pendataan bantuan TEKAD, menggunakan MySQL/MariaDB XAMPP Anda dan penyimpanan berkas lokal server.

## Struktur proyek

```text
RekapTEKAD/
  frontend/
    src/               # React, formulir, dashboard, grafik
    public/            # logo Kemendesa dan TEKAD, aset lokal
    vite.config.js     # frontend 8000, proxy /api ke backend 3000
    package.json
  backend/
    src/
      model/           # kueri SQL dan akses data
      middleware/      # autentikasi, peran admin, validasi, upload, error
      routes/          # endpoint API
      config/          # .env, database, penyimpanan lokal
      utils/           # transaksi, audit, validasi, JSON, hierarki wilayah
      controller/      # alur permintaan dan respons
      app.js
      server.js
    database/          # skema, data wilayah, contoh data, SQL gabungan
    scripts/           # pemeriksaan database dan ekspor SQL
    tests/
    storage/           # berkas lokal/arsip yang diabaikan Git
    .env               # kredensial backend, tidak di-commit
    .env.example
    package.json
  package.json         # perintah bersama melalui npm workspaces
  package-lock.json
```

## Menjalankan dengan XAMPP

1. Aktifkan MySQL melalui XAMPP yang sudah Anda miliki.
2. Sesuaikan `backend/.env`. Konfigurasi lokal yang berhasil diperiksa menggunakan `DB_HOST=127.0.0.1`, `DB_PORT=3306`, `DB_NAME=rekap_tekad`, `DB_USER=root`, dan password kosong. Jika akun XAMPP Anda berubah, sesuaikan kredensial tersebut. `DB_SOCKET` opsional untuk koneksi socket XAMPP.
3. Dari folder utama proyek:

   ```sh
   npm install
   npm run db:check
   npm run dev
   ```

4. Buka [frontend](http://127.0.0.1:8000). API di [port 3000](http://127.0.0.1:3000/api/health). Kedua server hanya mendengarkan koneksi loopback komputer ini.

Untuk menjalankan terpisah: `npm run dev:backend` dan `npm run dev:frontend`. Perintah `npm run dev` di dalam masing-masing folder juga tersedia. Konfigurasi backend selalu dibaca dari `backend/.env` berdasarkan lokasi file, bukan direktori terminal. Setelah mengubah konfigurasi/backend, jalankan ulang backend.

Tidak ada perintah menjalankan atau memasang MySQL tambahan dalam `npm run dev`. Database tetap berasal dari XAMPP Anda. Sisa runtime percobaan sebelumnya dipindahkan ke `backend/storage/legacy-mysql`; skrip pemasangan lama disimpan terpisah di `backend/scripts/legacy` dan tidak dipakai oleh alur aplikasi ini.

## Database dan akun contoh

Database `rekap_tekad` serta enam tabel sudah tersedia pada XAMPP yang diperiksa. Tidak perlu mengimpor ulang hanya karena pemisahan folder atau perubahan konfigurasi ini.

Untuk pemasangan baru, impor `backend/database/rekap_tekad.sql` pada database tersebut melalui phpMyAdmin. Isinya skema enam tabel, 91.599 wilayah, empat akun contoh, enam BUMDes simulasi, dan log contoh. Alternatif file terpisah/potongan kecil dijelaskan pada [panduan impor](backend/database/README.md). File SQL tidak menghapus tabel atau membuat database baru. File ini bukan migrasi untuk tabel dengan struktur berbeda.

| Username             | Peran         | Status   |
| -------------------- | ------------- | -------- |
| `admin_demo`         | Administrator | Aktif    |
| `petugas_ntt_demo`   | Pengguna      | Aktif    |
| `petugas_papua_demo` | Pengguna      | Aktif    |
| `nonaktif_demo`      | Pengguna      | Nonaktif |

Password semua akun contoh: **`DemoTekad2026!`**. Akun demo berbeda dari `ADMIN_USERNAME`/`ADMIN_PASSWORD` yang hanya digunakan oleh skrip setup alternatif. Mengubah nilai tersebut tidak mereset akun yang sudah ada. Impor ulang contoh juga tidak mereset password.

Semua BUMDes, kontak dan nominal bantuan contoh adalah simulasi. Master wilayah berasal dari file Anda. Pada database baru, data contoh menghasilkan 6 BUMDes, 4 penerima, 2 belum menerima dan total simulasi Rp285.000.000. Tidak ada sesi atau berkas R2 palsu yang diimpor.

## Fitur dan keamanan

Registrasi langsung aktif sebagai pengguna biasa; login memakai cookie HttpOnly/SameSite Strict dan token acak yang hanya disimpan sebagai hash. Password di-hash bcrypt cost 12. Perubahan password mencabut seluruh sesi. Pengguna langsung masuk ke satu formulir BUMDes setelah login. Pengguna hanya dapat mengisi satu kali sebagai data awal lalu memperbarui data yang sama; tidak memiliki menu daftar/tambah/hapus data. Dokumentasi tersedia di bawah formulir setelah penyimpanan. Profil dan log aktivitas tetap tersedia. Admin memakai dashboard/daftar data serta mengelola akun, peran dan status. Penghapusan akun menutup akses dan mengarsipkan akun agar riwayat tetap utuh.

Profil dan BUMDes menggunakan pilihan wilayah bertingkat dengan validasi kode/hierarki pada backend. Nama disalin dari master, bukan dipercaya dari input klien. JSON MySQL maupun JSON berbasis teks MariaDB ditangani oleh backend. Semua kueri memakai parameter, perubahan data dan log berada dalam transaksi, dan versi penyuntingan mencegah perubahan saling menimpa.

Dashboard/grafik memakai data database, tersedia filter dan ekspor CSV. Log menampilkan 500 aktivitas terbaru; seluruh riwayat tetap disimpan. Request mutasi memeriksa Origin localhost yang diizinkan dan akses dibatasi menurut akun. Batas request, Helmet, validasi server dan batas upload juga diterapkan.

## Penyimpanan lokal server

Lampiran disimpan secara privat di `backend/storage/uploads/`:

```text
backend/
  src/config/storage.js
  src/utils/localStorage.js
  storage/uploads/assets/
    images/<record-id>/<uuid>
    documents/<record-id>/<uuid>
```

Atur `STORAGE_DIR=storage/uploads` pada environment backend, atau gunakan path absolut ke disk persisten server. Path relatif dihitung dari folder backend. Folder dibuat otomatis; pengguna proses Node harus memiliki izin baca/tulis. Berkas unggahan diabaikan Git dan tidak disertakan build frontend. Jangan letakkan folder ini pada public/public_html atau menyajikannya lewat static hosting.

Foto hanya PNG/JPG/JPEG; bukti penerimaan hanya PDF. Unggahan maksimal 2 MB dan hasil kompresi maksimal 1 MB. Endpoint `/api/files/:id` memberikan URL unduhan lokal `/api/files/:id/content`; kedua endpoint memeriksa sesi dan kepemilikan/admin. URL tidak memberi akses tanpa login. Nama asli dipertahankan saat unduh, sedangkan nama di disk berupa UUID.

Kredensial R2 tidak digunakan lagi. Tidak diperlukan perubahan schema SQL; kolom `object_key` tetap menyimpan path relatif. Lampiran yang sebelumnya diunggah ke R2 **belum dipindahkan otomatis**. Salin objek `assets/images/...` dan `assets/documents/...` dari bucket lama ke `backend/storage/uploads/assets/...` dengan key yang sama, tanpa mengubah isi metadata tabel `attachments`. Uji unduhan sebelum menghapus salinan R2. Jika belum disalin, aplikasi menampilkan berkas tidak ditemukan. Untuk server lain, pindahkan database dan folder uploads bersama-sama. Sertakan keduanya dalam cadangan, dan gunakan volume persisten ketika deploy ulang.

Pemeriksaan melalui `node backend/scripts/check-upload.js` menggunakan akun demo dan berkas buatan, menguji kompresi, unggah, unduh, akses antar akun dan tanpa login, lalu membersihkan berkas uji; log pengujian tetap disimpan. Skrip memerlukan aplikasi dan database aktif serta akun demo yang sesuai.

## Pemeriksaan

```sh
npm test
npm run build
npm run db:check
```

`db:check` hanya membaca metadata, keberadaan tabel, jumlah wilayah dan kecocokan hash akun demo. Tidak mengimpor, menghapus atau mereset data. Build berada di `frontend/dist`.

Test integrasi yang membuat data hanya boleh dijalankan pada database terpisah berakhiran `_test` melalui `backend/tests/integration.js`. Siapkan konfigurasi test eksplisit agar tidak menggunakan data operasional. Fitur lain yang belum disediakan: reset password melalui email, MFA, pemindaian antivirus, dan deployment publik.

## Aturan satu data per pengguna

API `GET /api/records/mine` mengembalikan formulir tetap pengguna. Pembuatan pertama mengunci baris akun dalam transaksi lalu memeriksa data yang sudah ada, sehingga dua pengiriman bersamaan tidak menghasilkan dua data. Pembuatan kedua ditolak 409. Pengguna hanya dapat menyunting formulir tersebut, dan tidak dapat menghapusnya (403). Admin tetap dapat mengelola seluruh data.

Untuk data lama yang terlanjur ganda, entri dengan ID paling awal menjadi formulir tetap pengguna. Data tambahan tidak dihapus dan tetap tersedia bagi admin. Endpoint pengguna hanya mengembalikan formulir utama; penyuntingan dan akses lampiran entri tambahan ditolak. Layar pengguna menampilkan pemberitahuan jumlah data tambahan agar penanganannya tidak tersembunyi.

Paket contoh untuk impor baru sudah disesuaikan: masing-masing petugas aktif mempunyai satu data; contoh tambahan dikelola admin. Impor ulang tidak memindahkan pemilik atau menggandakan data contoh yang sudah ada. Tidak diperlukan perubahan skema/impor ulang untuk menerapkan pembatasan backend ini.

## Kompresi lampiran

Unggahan maksimal 2 MB; backend memproses foto memakai Sharp dan PDF memakai Ghostscript sebelum menulis ke penyimpanan lokal. Hasil yang disimpan maksimal 1 MB (1.048.576 byte). Foto mempertahankan format PNG/JPEG; PDF tetap PDF dan jumlah halaman diperiksa. Berkas yang sudah kecil tidak diperbesar. Jika target tidak tercapai atau berkas rusak/terkunci, permintaan ditolak sebelum penyimpanan. Lampiran lama tidak diubah. Kompresi dapat mengurangi kualitas gambar; periksa keterbacaan hasil unduhan.

Ghostscript harus tersedia pada PATH backend (`gs`), atau atur `GHOSTSCRIPT_PATH` ke executable Ghostscript. Di komputer ini executable tersedia di `/usr/local/bin/gs`. Direktori sementara privat dibersihkan setelah proses, batas waktu 20 detik per percobaan, maksimal dua proses unggahan bersamaan.
