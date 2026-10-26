import { z } from "zod";
import multer from "multer";
export const errorHandler = (err, req, res, next) => {
  if (err instanceof z.ZodError)
    return res.status(400).json({
      message: err.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    });
  if (["ER_ACCESS_DENIED_ERROR", "ER_DBACCESS_DENIED_ERROR"].includes(err.code))
    return res.status(503).json({
      message:
        "Akun database tidak dapat mengakses rekap_tekad. Periksa DB_USER dan DB_PASSWORD di backend/.env.",
    });
  if (
    [
      "ECONNREFUSED",
      "ETIMEDOUT",
      "ENOTFOUND",
      "PROTOCOL_CONNECTION_LOST",
      "EPERM",
    ].includes(err.code)
  )
    return res.status(503).json({
      message:
        "Koneksi MySQL gagal. Pastikan MySQL XAMPP aktif dan DB_HOST/DB_PORT di backend/.env sesuai.",
    });
  if (err.code === "ER_BAD_DB_ERROR")
    return res.status(503).json({
      message: "Database belum tersedia. Periksa DB_NAME di backend/.env.",
    });
  if (err.code === "ER_NO_SUCH_TABLE" && err.sqlMessage?.includes("wilayah"))
    return res.status(503).json({
      message:
        "Master wilayah belum tersedia. Impor backend/database/01_schema.sql dan backend/database/02_wilayah.sql melalui phpMyAdmin.",
    });
  if (err.code === "ER_NO_SUCH_TABLE")
    return res.status(503).json({
      message:
        "Skema database belum lengkap. Impor backend/database/01_schema.sql melalui phpMyAdmin.",
    });
  if (err.code === "ER_DUP_ENTRY")
    return res
      .status(409)
      .json({ message: "Username atau email sudah digunakan" });
  if (err.code === "ER_ROW_IS_REFERENCED_2")
    return res.status(409).json({
      message:
        "Pengguna memiliki data/riwayat. Nonaktifkan akun untuk mempertahankan riwayat.",
    });
  if (err instanceof multer.MulterError)
    return res.status(400).json({
      message: "Berkas melebihi batas 2 MB atau format permintaan tidak valid",
    });
  console.error(err.message);
  res.status(err.status || 500).json({
    message: err.status
      ? err.message
      : "Server tidak dapat memproses permintaan. Periksa koneksi database dan konfigurasi.",
  });
};
