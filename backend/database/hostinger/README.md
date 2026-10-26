# Impor Hostinger

Pilih database `u420903862_rekap_tekad` pada phpMyAdmin, lalu impor berurutan:

1. `01_schema.sql`: struktur tabel.
2. `02_wilayah.sql`: master wilayah.

Tidak berisi akun demo atau data operasional localhost. Tidak membuat atau menghapus database. File lokal asli tetap dipertahankan.

Konfigurasi backend di server harus menggunakan `DB_NAME=u420903862_rekap_tekad`, serta DB_HOST, DB_USER, dan DB_PASSWORD sesuai kredensial Hostinger. Konfigurasi localhost tidak diubah.
