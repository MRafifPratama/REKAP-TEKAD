# Backend Rekap TEKAD

Express berjalan di `127.0.0.1:3000`. Konfigurasi dibaca dari `backend/.env` berdasarkan lokasi file, sehingga tetap benar baik perintah dijalankan dari root proyek maupun folder backend.

```text
backend/
  src/
    config/       # environment, pool MariaDB/MySQL, penyimpanan lokal
    model/        # kueri SQL dan akses data
    middleware/   # autentikasi, peran, Origin, validasi ID, upload, error
    routes/       # pemetaan endpoint ke controller
    utils/        # validasi, transaksi, audit, JSON, pemeriksaan wilayah
    controller/   # alur permintaan dan respons
    app.js        # perakitan Express, dapat diimpor oleh test tanpa listen
    server.js     # menjalankan HTTP server localhost
  database/       # skema, master wilayah, data contoh, SQL gabungan
  scripts/        # cek koneksi baca-saja dan ekspor SQL
  tests/
  storage/        # file lokal yang diabaikan Git, termasuk sisa percobaan lama
```

Dari folder root gunakan `npm run dev:backend`, `npm run db:check`, atau `npm test`. Dari folder backend gunakan `npm run dev`, `npm run db:check`, atau `npm test`. Pemeriksaan database hanya membaca metadata/tabel dan memverifikasi hash akun demo; tidak mengimpor/reset data. Impor manual tetap melalui phpMyAdmin, lihat `database/README.md`.

Skrip lama pemasangan database disimpan di `scripts/legacy` untuk mempertahankan berkas sebelumnya, tidak digunakan oleh perintah menjalankan aplikasi. MySQL yang digunakan adalah layanan XAMPP Anda.

Pengujian login melalui proxy frontend tersedia pada `node backend/scripts/check-login.js` dari root proyek. Skrip itu memakai akun demo dan membuat log login/logout, tanpa mengubah profil/data bantuan. Ia memeriksa cookie sesi, penolakan akun nonaktif, pemisahan data dan akses admin.

## Lampiran lokal

Folder privat `storage/uploads/assets/images` dan `storage/uploads/assets/documents` dibuat otomatis. Konfigurasi `STORAGE_DIR` relatif terhadap backend atau path absolut disk persisten. Unduhan tetap melalui API dengan autentikasi; jangan expose folder ini sebagai static/public. Schema database tidak berubah. Untuk lampiran R2 lama, salin objek ke folder uploads dengan object key yang sama. Cadangkan database beserta folder ini. Kompresi PDF tetap memerlukan Ghostscript.
