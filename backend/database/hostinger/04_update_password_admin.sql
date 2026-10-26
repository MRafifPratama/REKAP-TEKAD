-- Jalankan jika akun admin telah diimpor sebelumnya.
USE `u420903862_rekap_tekad`;
START TRANSACTION;
UPDATE users SET password_hash = '$2b$12$PNgZnAFa731vVkIKtcNT0.A0eOTvPt7vKP8iUFMxzyEiZTlySu97y' WHERE username = 'admin' AND role = 'admin';
DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE username = 'admin' AND role = 'admin');
COMMIT;
