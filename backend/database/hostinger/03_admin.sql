-- Impor setelah 01_schema.sql. Tidak mereset akun yang sudah ada.
-- Email dan profil awal adalah placeholder; lengkapi melalui aplikasi.
SET NAMES utf8mb4;
USE `u420903862_rekap_tekad`;

INSERT INTO users (username, email, password_hash, role, active, profile)
SELECT 'admin', 'admin@example.com', '$2b$12$PNgZnAFa731vVkIKtcNT0.A0eOTvPt7vKP8iUFMxzyEiZTlySu97y', 'admin', 1,
'{"username":"admin","fullName":"Administrator TEKAD","email":"admin@example.com","phone":"","address":"","province":"","regency":"","district":"","village":"","provinceCode":"","regencyCode":"","districtCode":"","villageCode":""}'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE username = 'admin' OR email = 'admin@example.com'
);
