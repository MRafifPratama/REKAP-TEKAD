-- Rekap TEKAD: impor pada database rekap_tekad yang sudah tersedia.
-- Tidak membuat/menghapus database. Tidak menghapus data yang sudah ada.
SET NAMES utf8mb4;
SET time_zone = '+00:00';
USE rekap_tekad;

-- DATA SIMULASI, BUKAN DATA PENERIMA BANTUAN RESMI.
-- Password semua akun demo: DemoTekad2026!
-- Tidak mengubah password/peran akun dengan username/email yang sudah ada.
-- Tidak memasukkan sesi atau referensi berkas R2 fiktif.
START TRANSACTION;

INSERT IGNORE INTO users (username,email,password_hash,role,active,profile) VALUES ('admin_demo','admin_demo@example.test','$2b$12$HzZYdyRm4DqzNwDy1X9EnOqscx16k9ui/sAslrgVrKFHnowBNwPUa','admin',TRUE,JSON_OBJECT('username','admin_demo','fullName','Administrator Demo','email','admin_demo@example.test','phone','080000000000','address','Alamat simulasi (bukan alamat operasional)','provinceCode','53','regencyCode','53.01','districtCode','53.01.04','villageCode','53.01.04.2003','province','Nusa Tenggara Timur','regency','Kabupaten Kupang','district','Semau','village','Bokonusan'));

INSERT IGNORE INTO users (username,email,password_hash,role,active,profile) VALUES ('petugas_ntt_demo','petugas_ntt_demo@example.test','$2b$12$HzZYdyRm4DqzNwDy1X9EnOqscx16k9ui/sAslrgVrKFHnowBNwPUa','user',TRUE,JSON_OBJECT('username','petugas_ntt_demo','fullName','Petugas NTT Demo','email','petugas_ntt_demo@example.test','phone','080000000000','address','Alamat simulasi (bukan alamat operasional)','provinceCode','53','regencyCode','53.01','districtCode','53.01.04','villageCode','53.01.04.2003','province','Nusa Tenggara Timur','regency','Kabupaten Kupang','district','Semau','village','Bokonusan'));

INSERT IGNORE INTO users (username,email,password_hash,role,active,profile) VALUES ('petugas_papua_demo','petugas_papua_demo@example.test','$2b$12$HzZYdyRm4DqzNwDy1X9EnOqscx16k9ui/sAslrgVrKFHnowBNwPUa','user',TRUE,JSON_OBJECT('username','petugas_papua_demo','fullName','Petugas Papua Demo','email','petugas_papua_demo@example.test','phone','080000000000','address','Alamat simulasi (bukan alamat operasional)','provinceCode','92','regencyCode','92.02','districtCode','92.02.03','villageCode','92.02.03.2001','province','Papua Barat','regency','Kabupaten Manokwari','district','Warmare','village','Dindey'));

INSERT IGNORE INTO users (username,email,password_hash,role,active,profile) VALUES ('nonaktif_demo','nonaktif_demo@example.test','$2b$12$HzZYdyRm4DqzNwDy1X9EnOqscx16k9ui/sAslrgVrKFHnowBNwPUa','user',FALSE,JSON_OBJECT('username','nonaktif_demo','fullName','Pengguna Nonaktif Demo','email','nonaktif_demo@example.test','phone','080000000000','address','Alamat simulasi (bukan alamat operasional)','provinceCode','81','regencyCode','81.01','districtCode','81.01.01','villageCode','81.01.01.1009','province','Maluku','regency','Kabupaten Maluku Tengah','district','Amahai','village','Hollo'));

-- SIMULASI - BUMDes Bokonusan
SET @demo_owner=(SELECT id FROM users WHERE username='petugas_ntt_demo' LIMIT 1);
SET @demo_existing=(SELECT id FROM records WHERE JSON_UNQUOTE(JSON_EXTRACT(data,'$.name'))='SIMULASI - BUMDes Bokonusan' LIMIT 1);
INSERT INTO records (user_id,data,version) SELECT @demo_owner,JSON_OBJECT('provinceCode','53','regencyCode','53.01','districtCode','53.01.04','villageCode','53.01.04.2003','province','Nusa Tenggara Timur','regency','Kabupaten Kupang','district','Semau','village','Bokonusan','name','SIMULASI - BUMDes Bokonusan','address','Alamat BUMDes simulasi di Bokonusan','contactName','Kontak Simulasi 1','contactEmail','kontak1@example.test','contactPhone','080000000000','management','SIMULASI
Direktur: Pengurus Contoh
Sekretaris: Sekretaris Contoh
Bendahara: Bendahara Contoh','location','https://www.google.com/maps/search/?api=1&query=Bokonusan%20Kabupaten%20Kupang','products','Kopi kemasan; keripik pisang','received',JSON_EXTRACT('true','$'),'receivedDate','2026-05-12','amount',50000000),1 WHERE @demo_existing IS NULL;
SET @demo_created=ROW_COUNT();
SET @demo_record=COALESCE(@demo_existing,LAST_INSERT_ID());
INSERT INTO activity_logs (user_id,action,entity,entity_id,changes) SELECT @demo_owner,'Tambah data contoh','bumdes',CAST(@demo_record AS CHAR),JSON_OBJECT('source','SQL demo','after',JSON_OBJECT('provinceCode','53','regencyCode','53.01','districtCode','53.01.04','villageCode','53.01.04.2003','province','Nusa Tenggara Timur','regency','Kabupaten Kupang','district','Semau','village','Bokonusan','name','SIMULASI - BUMDes Bokonusan','address','Alamat BUMDes simulasi di Bokonusan','contactName','Kontak Simulasi 1','contactEmail','kontak1@example.test','contactPhone','080000000000','management','SIMULASI
Direktur: Pengurus Contoh
Sekretaris: Sekretaris Contoh
Bendahara: Bendahara Contoh','location','https://www.google.com/maps/search/?api=1&query=Bokonusan%20Kabupaten%20Kupang','products','Kopi kemasan; keripik pisang','received',JSON_EXTRACT('true','$'),'receivedDate','2026-05-12','amount',50000000)) WHERE @demo_created=1;
-- Contoh audit perubahan status bantuan pada data simulasi.
INSERT INTO activity_logs (user_id,action,entity,entity_id,changes) SELECT @demo_owner,'Ubah data contoh','bumdes',CAST(@demo_record AS CHAR),JSON_OBJECT('source','SQL demo','before',JSON_OBJECT('provinceCode','53','regencyCode','53.01','districtCode','53.01.04','villageCode','53.01.04.2003','province','Nusa Tenggara Timur','regency','Kabupaten Kupang','district','Semau','village','Bokonusan','name','SIMULASI - BUMDes Bokonusan','address','Alamat BUMDes simulasi di Bokonusan','contactName','Kontak Simulasi 1','contactEmail','kontak1@example.test','contactPhone','080000000000','management','SIMULASI
Direktur: Pengurus Contoh
Sekretaris: Sekretaris Contoh
Bendahara: Bendahara Contoh','location','https://www.google.com/maps/search/?api=1&query=Bokonusan%20Kabupaten%20Kupang','products','Kopi kemasan; keripik pisang','received',JSON_EXTRACT('false','$'),'receivedDate','','amount',0),'after',JSON_OBJECT('provinceCode','53','regencyCode','53.01','districtCode','53.01.04','villageCode','53.01.04.2003','province','Nusa Tenggara Timur','regency','Kabupaten Kupang','district','Semau','village','Bokonusan','name','SIMULASI - BUMDes Bokonusan','address','Alamat BUMDes simulasi di Bokonusan','contactName','Kontak Simulasi 1','contactEmail','kontak1@example.test','contactPhone','080000000000','management','SIMULASI
Direktur: Pengurus Contoh
Sekretaris: Sekretaris Contoh
Bendahara: Bendahara Contoh','location','https://www.google.com/maps/search/?api=1&query=Bokonusan%20Kabupaten%20Kupang','products','Kopi kemasan; keripik pisang','received',JSON_EXTRACT('true','$'),'receivedDate','2026-05-12','amount',50000000)) WHERE @demo_created=1;

-- SIMULASI - BUMDes Otan
SET @demo_owner=(SELECT id FROM users WHERE username='admin_demo' LIMIT 1);
SET @demo_existing=(SELECT id FROM records WHERE JSON_UNQUOTE(JSON_EXTRACT(data,'$.name'))='SIMULASI - BUMDes Otan' LIMIT 1);
INSERT INTO records (user_id,data,version) SELECT @demo_owner,JSON_OBJECT('provinceCode','53','regencyCode','53.01','districtCode','53.01.04','villageCode','53.01.04.2004','province','Nusa Tenggara Timur','regency','Kabupaten Kupang','district','Semau','village','Otan','name','SIMULASI - BUMDes Otan','address','Alamat BUMDes simulasi di Otan','contactName','Kontak Simulasi 2','contactEmail','kontak2@example.test','contactPhone','080000000000','management','SIMULASI
Direktur: Pengurus Contoh
Sekretaris: Sekretaris Contoh
Bendahara: Bendahara Contoh','location','https://www.google.com/maps/search/?api=1&query=Otan%20Kabupaten%20Kupang','products','Tenun; jasa penggilingan','received',JSON_EXTRACT('false','$'),'receivedDate','','amount',0),1 WHERE @demo_existing IS NULL;
SET @demo_created=ROW_COUNT();
SET @demo_record=COALESCE(@demo_existing,LAST_INSERT_ID());
INSERT INTO activity_logs (user_id,action,entity,entity_id,changes) SELECT @demo_owner,'Tambah data contoh','bumdes',CAST(@demo_record AS CHAR),JSON_OBJECT('source','SQL demo','after',JSON_OBJECT('provinceCode','53','regencyCode','53.01','districtCode','53.01.04','villageCode','53.01.04.2004','province','Nusa Tenggara Timur','regency','Kabupaten Kupang','district','Semau','village','Otan','name','SIMULASI - BUMDes Otan','address','Alamat BUMDes simulasi di Otan','contactName','Kontak Simulasi 2','contactEmail','kontak2@example.test','contactPhone','080000000000','management','SIMULASI
Direktur: Pengurus Contoh
Sekretaris: Sekretaris Contoh
Bendahara: Bendahara Contoh','location','https://www.google.com/maps/search/?api=1&query=Otan%20Kabupaten%20Kupang','products','Tenun; jasa penggilingan','received',JSON_EXTRACT('false','$'),'receivedDate','','amount',0)) WHERE @demo_created=1;

-- SIMULASI - BUMDes Dindey
SET @demo_owner=(SELECT id FROM users WHERE username='petugas_papua_demo' LIMIT 1);
SET @demo_existing=(SELECT id FROM records WHERE JSON_UNQUOTE(JSON_EXTRACT(data,'$.name'))='SIMULASI - BUMDes Dindey' LIMIT 1);
INSERT INTO records (user_id,data,version) SELECT @demo_owner,JSON_OBJECT('provinceCode','92','regencyCode','92.02','districtCode','92.02.03','villageCode','92.02.03.2001','province','Papua Barat','regency','Kabupaten Manokwari','district','Warmare','village','Dindey','name','SIMULASI - BUMDes Dindey','address','Alamat BUMDes simulasi di Dindey','contactName','Kontak Simulasi 3','contactEmail','kontak3@example.test','contactPhone','080000000000','management','SIMULASI
Direktur: Pengurus Contoh
Sekretaris: Sekretaris Contoh
Bendahara: Bendahara Contoh','location','https://www.google.com/maps/search/?api=1&query=Dindey%20Kabupaten%20Manokwari','products','Kakao; sayuran','received',JSON_EXTRACT('true','$'),'receivedDate','2026-06-10','amount',75000000),1 WHERE @demo_existing IS NULL;
SET @demo_created=ROW_COUNT();
SET @demo_record=COALESCE(@demo_existing,LAST_INSERT_ID());
INSERT INTO activity_logs (user_id,action,entity,entity_id,changes) SELECT @demo_owner,'Tambah data contoh','bumdes',CAST(@demo_record AS CHAR),JSON_OBJECT('source','SQL demo','after',JSON_OBJECT('provinceCode','92','regencyCode','92.02','districtCode','92.02.03','villageCode','92.02.03.2001','province','Papua Barat','regency','Kabupaten Manokwari','district','Warmare','village','Dindey','name','SIMULASI - BUMDes Dindey','address','Alamat BUMDes simulasi di Dindey','contactName','Kontak Simulasi 3','contactEmail','kontak3@example.test','contactPhone','080000000000','management','SIMULASI
Direktur: Pengurus Contoh
Sekretaris: Sekretaris Contoh
Bendahara: Bendahara Contoh','location','https://www.google.com/maps/search/?api=1&query=Dindey%20Kabupaten%20Manokwari','products','Kakao; sayuran','received',JSON_EXTRACT('true','$'),'receivedDate','2026-06-10','amount',75000000)) WHERE @demo_created=1;

-- SIMULASI - BUMDes Indisey
SET @demo_owner=(SELECT id FROM users WHERE username='admin_demo' LIMIT 1);
SET @demo_existing=(SELECT id FROM records WHERE JSON_UNQUOTE(JSON_EXTRACT(data,'$.name'))='SIMULASI - BUMDes Indisey' LIMIT 1);
INSERT INTO records (user_id,data,version) SELECT @demo_owner,JSON_OBJECT('provinceCode','92','regencyCode','92.02','districtCode','92.02.03','villageCode','92.02.03.2002','province','Papua Barat','regency','Kabupaten Manokwari','district','Warmare','village','Indisey','name','SIMULASI - BUMDes Indisey','address','Alamat BUMDes simulasi di Indisey','contactName','Kontak Simulasi 4','contactEmail','kontak4@example.test','contactPhone','080000000000','management','SIMULASI
Direktur: Pengurus Contoh
Sekretaris: Sekretaris Contoh
Bendahara: Bendahara Contoh','location','https://www.google.com/maps/search/?api=1&query=Indisey%20Kabupaten%20Manokwari','products','Kopi; bibit tanaman','received',JSON_EXTRACT('true','$'),'receivedDate','2026-07-15','amount',100000000),1 WHERE @demo_existing IS NULL;
SET @demo_created=ROW_COUNT();
SET @demo_record=COALESCE(@demo_existing,LAST_INSERT_ID());
INSERT INTO activity_logs (user_id,action,entity,entity_id,changes) SELECT @demo_owner,'Tambah data contoh','bumdes',CAST(@demo_record AS CHAR),JSON_OBJECT('source','SQL demo','after',JSON_OBJECT('provinceCode','92','regencyCode','92.02','districtCode','92.02.03','villageCode','92.02.03.2002','province','Papua Barat','regency','Kabupaten Manokwari','district','Warmare','village','Indisey','name','SIMULASI - BUMDes Indisey','address','Alamat BUMDes simulasi di Indisey','contactName','Kontak Simulasi 4','contactEmail','kontak4@example.test','contactPhone','080000000000','management','SIMULASI
Direktur: Pengurus Contoh
Sekretaris: Sekretaris Contoh
Bendahara: Bendahara Contoh','location','https://www.google.com/maps/search/?api=1&query=Indisey%20Kabupaten%20Manokwari','products','Kopi; bibit tanaman','received',JSON_EXTRACT('true','$'),'receivedDate','2026-07-15','amount',100000000)) WHERE @demo_created=1;

-- SIMULASI - BUMDes Hollo
SET @demo_owner=(SELECT id FROM users WHERE username='admin_demo' LIMIT 1);
SET @demo_existing=(SELECT id FROM records WHERE JSON_UNQUOTE(JSON_EXTRACT(data,'$.name'))='SIMULASI - BUMDes Hollo' LIMIT 1);
INSERT INTO records (user_id,data,version) SELECT @demo_owner,JSON_OBJECT('provinceCode','81','regencyCode','81.01','districtCode','81.01.01','villageCode','81.01.01.1009','province','Maluku','regency','Kabupaten Maluku Tengah','district','Amahai','village','Hollo','name','SIMULASI - BUMDes Hollo','address','Alamat BUMDes simulasi di Hollo','contactName','Kontak Simulasi 5','contactEmail','kontak5@example.test','contactPhone','080000000000','management','SIMULASI
Direktur: Pengurus Contoh
Sekretaris: Sekretaris Contoh
Bendahara: Bendahara Contoh','location','https://www.google.com/maps/search/?api=1&query=Hollo%20Kabupaten%20Maluku%20Tengah','products','Olahan ikan; kerajinan','received',JSON_EXTRACT('false','$'),'receivedDate','','amount',0),1 WHERE @demo_existing IS NULL;
SET @demo_created=ROW_COUNT();
SET @demo_record=COALESCE(@demo_existing,LAST_INSERT_ID());
INSERT INTO activity_logs (user_id,action,entity,entity_id,changes) SELECT @demo_owner,'Tambah data contoh','bumdes',CAST(@demo_record AS CHAR),JSON_OBJECT('source','SQL demo','after',JSON_OBJECT('provinceCode','81','regencyCode','81.01','districtCode','81.01.01','villageCode','81.01.01.1009','province','Maluku','regency','Kabupaten Maluku Tengah','district','Amahai','village','Hollo','name','SIMULASI - BUMDes Hollo','address','Alamat BUMDes simulasi di Hollo','contactName','Kontak Simulasi 5','contactEmail','kontak5@example.test','contactPhone','080000000000','management','SIMULASI
Direktur: Pengurus Contoh
Sekretaris: Sekretaris Contoh
Bendahara: Bendahara Contoh','location','https://www.google.com/maps/search/?api=1&query=Hollo%20Kabupaten%20Maluku%20Tengah','products','Olahan ikan; kerajinan','received',JSON_EXTRACT('false','$'),'receivedDate','','amount',0)) WHERE @demo_created=1;

-- SIMULASI - BUMDes Tamilouw
SET @demo_owner=(SELECT id FROM users WHERE username='admin_demo' LIMIT 1);
SET @demo_existing=(SELECT id FROM records WHERE JSON_UNQUOTE(JSON_EXTRACT(data,'$.name'))='SIMULASI - BUMDes Tamilouw' LIMIT 1);
INSERT INTO records (user_id,data,version) SELECT @demo_owner,JSON_OBJECT('provinceCode','81','regencyCode','81.01','districtCode','81.01.01','villageCode','81.01.01.2001','province','Maluku','regency','Kabupaten Maluku Tengah','district','Amahai','village','Tamilouw','name','SIMULASI - BUMDes Tamilouw','address','Alamat BUMDes simulasi di Tamilouw','contactName','Kontak Simulasi 6','contactEmail','kontak6@example.test','contactPhone','080000000000','management','SIMULASI
Direktur: Pengurus Contoh
Sekretaris: Sekretaris Contoh
Bendahara: Bendahara Contoh','location','https://www.google.com/maps/search/?api=1&query=Tamilouw%20Kabupaten%20Maluku%20Tengah','products','Pala; minyak kelapa','received',JSON_EXTRACT('true','$'),'receivedDate','2026-08-20','amount',60000000),1 WHERE @demo_existing IS NULL;
SET @demo_created=ROW_COUNT();
SET @demo_record=COALESCE(@demo_existing,LAST_INSERT_ID());
INSERT INTO activity_logs (user_id,action,entity,entity_id,changes) SELECT @demo_owner,'Tambah data contoh','bumdes',CAST(@demo_record AS CHAR),JSON_OBJECT('source','SQL demo','after',JSON_OBJECT('provinceCode','81','regencyCode','81.01','districtCode','81.01.01','villageCode','81.01.01.2001','province','Maluku','regency','Kabupaten Maluku Tengah','district','Amahai','village','Tamilouw','name','SIMULASI - BUMDes Tamilouw','address','Alamat BUMDes simulasi di Tamilouw','contactName','Kontak Simulasi 6','contactEmail','kontak6@example.test','contactPhone','080000000000','management','SIMULASI
Direktur: Pengurus Contoh
Sekretaris: Sekretaris Contoh
Bendahara: Bendahara Contoh','location','https://www.google.com/maps/search/?api=1&query=Tamilouw%20Kabupaten%20Maluku%20Tengah','products','Pala; minyak kelapa','received',JSON_EXTRACT('true','$'),'receivedDate','2026-08-20','amount',60000000)) WHERE @demo_created=1;
COMMIT;
