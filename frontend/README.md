# Frontend Rekap TEKAD

React dan Vite berjalan di `http://127.0.0.1:8000`. Semua permintaan `/api` diteruskan ke backend `http://127.0.0.1:3000` sehingga cookie sesi tetap berasal dari origin yang sama.

Dari folder root: `npm run dev:frontend` atau `npm run build`. Dari folder frontend: `npm run dev` atau `npm run build`. Hasil build berada di `frontend/dist`. Kredensial database dan R2 hanya disimpan pada `backend/.env`, tidak pada frontend.

## Tampilan ponsel

Aturan responsif khusus berada di `src/styles/mobile.css`, dimuat setelah gaya utama. Pada lebar sampai 800px, navigasi menjadi drawer yang dapat ditutup, fokus ditahan pada menu yang terbuka, dan scroll latar dikunci. Menu ditutup saat logout. Pada lebar sampai 580px, formulir dan unggahan memakai satu kolom, status formulir berada pada baris tersendiri dan tombol aksi memenuhi area yang tersedia. Input memakai teks 16px dan kontrol sentuh minimal 44–48px. Tabel tetap dapat digeser di dalam pembungkusnya dan diberi petunjuk geser. Area aman layar serta tinggi viewport dinamis digunakan untuk header dan dialog.

Build dan pengujian render/unit tersedia melalui `npm run build` serta `npm test` dari root. Pengujian tersebut bukan pengujian visual pada ponsel fisik; pemeriksaan perangkat nyata belum dilakukan.
