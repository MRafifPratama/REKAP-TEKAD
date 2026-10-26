# Impor database Rekap TEKAD melalui phpMyAdmin XAMPP

Database `rekap_tekad` sudah disediakan oleh Anda. File impor tidak memasang atau menjalankan MySQL, tidak membuat database baru, dan tidak mengandung `DROP TABLE`/`DROP DATABASE`.

## Cara paling singkat

1. Jalankan MySQL dari XAMPP Anda, buka phpMyAdmin.
2. Klik database **rekap_tekad**.
3. Pilih tab **Import**, pilih **backend/database/rekap_tekad.sql**, lalu **Go/Kirim**.

File gabungan `backend/database/rekap_tekad.sql` sudah memuat skema, seluruh wilayah, dan contoh data. Ukurannya sekitar 2,7 MB. File ini ditujukan untuk database baru atau tabel dengan skema aplikasi yang sama. `CREATE TABLE IF NOT EXISTS` tidak memperbaiki struktur tabel lama yang berbeda.

## Alternatif impor terpisah

Impor berurutan:

1. `01_schema.sql`: enam tabel, termasuk master `wilayah`.
2. `02_wilayah.sql`: seluruh 91.599 kode/nama wilayah.
3. `03_contoh_data.sql`: empat akun demo, enam BUMDes simulasi dan tujuh log aktivitas awal.

Jika batas unggahan phpMyAdmin hanya 2 MB, ganti langkah 2 dengan mengimpor empat file `wilayah-parts/02_wilayah_01.sql` sampai `02_wilayah_04.sql`, satu per satu. Masing-masing di bawah 1 MB. Tidak perlu mengimpor `02_wilayah.sql` lagi.

`wilayah-sumber.sql` adalah salinan asli file yang Anda lampirkan, untuk rujukan/lisensi. **Jangan gunakan file sumber untuk impor aplikasi** karena berisi perintah `DROP TABLE` dan menggunakan MyISAM. File `02_wilayah.sql` merupakan hasil adaptasi aman dengan InnoDB. Nama yang sudah memiliki kode sama tidak ditimpa saat impor ulang. Data baru tetap dapat ditambahkan.

## Akun contoh

Semua akun berikut memakai password **`DemoTekad2026!`** (huruf besar/kecil diperhatikan). Password dalam SQL berupa hash bcrypt cost 12.

| Username             | Peran         | Status                                  |
| -------------------- | ------------- | --------------------------------------- |
| `admin_demo`         | Administrator | Aktif                                   |
| `petugas_ntt_demo`   | Pengguna      | Aktif                                   |
| `petugas_papua_demo` | Pengguna      | Aktif                                   |
| `nonaktif_demo`      | Pengguna      | Nonaktif, untuk mencoba penolakan login |

Akun contoh dibuat hanya jika username/email belum ada. Impor ulang tidak mereset password atau peran akun tersebut. Pengaturan `ADMIN_PASSWORD` di `backend/.env` adalah untuk skrip setup alternatif, bukan password akun demo ini.

Semua BUMDes, identitas kontak, alamat, susunan pengurus, produk, nominal dan penerimaan bantuan dalam contoh bersifat **simulasi**, bukan catatan program resmi. Nama wilayah berasal dari master yang Anda berikan. Nomor telepon dan alamat `.test` hanya placeholder. Tautan lokasi berupa pencarian wilayah, bukan koordinat bangunan BUMDes.

Pada database baru, dashboard contoh akan menunjukkan:

- 6 BUMDes di 3 provinsi.
- 4 sudah menerima; 2 belum menerima.
- Total bantuan simulasi Rp285.000.000.
- Pengguna biasa langsung membuka satu formulir tetap miliknya; admin melihat seluruh data. Pada contoh untuk impor baru, masing-masing petugas aktif memiliki satu data.

Tidak ada sesi login atau berkas R2 palsu yang diimpor. Tabel `sessions` dan `attachments` awalnya kosong. Unggah foto/bukti nyata melalui aplikasi setelah R2 dikonfigurasi. Sebelum pendataan operasional, buat akun operasional sendiri dan bersihkan/nonaktifkan akun serta data simulasi melalui aplikasi sesuai kebutuhan.

## Struktur dan integrasi wilayah

- `wilayah`: kode/nama, hierarki berdasarkan struktur kode.
- `users`: akun, bcrypt, peran, status, profil JSON dan arsip akun.
- `records`: pemilik, profil BUMDes/penerimaan JSON, versi penyuntingan, waktu.
- `attachments`: metadata berkas dan object key R2.
- `activity_logs`: pelaku, tindakan, objek dan perubahan sebelum/sesudah JSON.
- `sessions`: hash token, pemilik dan kedaluwarsa.

Kode wilayah: provinsi `53`, kabupaten `53.01`, kecamatan `53.01.04`, desa `53.01.04.2003`. Profil akun dan BUMDes menyimpan kode serta snapshot nama pada JSON. Backend memvalidasi bahwa keempat kode berada pada satu hierarki dan mengambil nama dari tabel `wilayah`. Mengganti pilihan induk mengosongkan pilihan anak.

Master hasil ekstraksi memiliki 38 provinsi, 514 kabupaten/kota, 7.285 kecamatan, 83.762 desa/kelurahan; tidak ditemukan kode ganda atau kode anak tanpa induk. Metadata file sumber menyebut Kepmendagri tahun 2025; tidak dilakukan pembaruan otomatis atau pengesahan ulang data tersebut.

Mengubah master tidak otomatis menulis ulang snapshot nama pada profil lama. Data lama yang belum menyimpan kode perlu dipilih ulang wilayahnya saat disunting. Pencarian master menggunakan query parameterized. Backend mengurai JSON baik dari tipe JSON native MySQL maupun kolom JSON berbasis teks pada MariaDB (yang digunakan sebagian instalasi XAMPP).

## Sambungkan aplikasi

Isi `backend/.env` menggunakan akun database Anda sendiri:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=rekap_tekad
DB_USER=nama_user_mysql_Anda
DB_PASSWORD=password_mysql_Anda
```

Jika akun MySQL XAMPP Anda memang tanpa password, biarkan `DB_PASSWORD=` kosong. Jangan menganggap username/password bawaan selalu sama pada semua komputer. Akun aplikasi cukup memiliki SELECT, INSERT, UPDATE, DELETE pada database ini setelah proses impor selesai.

Jalankan ulang backend setelah mengubah `backend/.env`/kode (`Ctrl+C`, lalu `npm run dev`). Frontend tetap port 8000 dan backend 3000. Tidak perlu menjalankan `mysql:local`, `db:bootstrap:local`, Docker, atau pemasangan MySQL lain.

## Verifikasi yang dilakukan

Jumlah, pola kode, duplikasi dan hubungan induk dari file sumber diperiksa secara offline. Seluruh contoh profil/BUMDes melewati validator aplikasi; hash password diverifikasi dengan bcrypt. Build React dan pengujian unit dijalankan. File impor tidak dieksekusi oleh agent; Anda yang melakukan impor melalui phpMyAdmin.

Setelah konfigurasi disesuaikan, koneksi baca-saja ke MariaDB XAMPP 10.4.21 berhasil: keenam tabel dan 91.599 wilayah tersedia, hash akun demo cocok. Pengujian HTTP melalui frontend port 8000 juga berhasil untuk login admin/pengguna, sesi, logout, penolakan akun nonaktif, akses admin dan isolasi data pengguna. Tidak diperlukan impor ulang untuk pemisahan folder frontend/backend.

Alur satu data juga menangani impor lama: bila pemilik terlanjur memiliki beberapa entri, ID paling awal dipakai sebagai formulir tetap. Entri tambahan tidak dihapus atau dipindah otomatis dan tetap dapat ditinjau admin. Tidak perlu mengimpor ulang database operasional untuk pembatasan ini.
