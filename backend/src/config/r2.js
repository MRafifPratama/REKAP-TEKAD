import "./env.js";
import { S3Client } from "@aws-sdk/client-s3";
export const s3 = () => {
  if (
    !process.env.R2_ACCOUNT_ID ||
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY
  )
    throw Object.assign(
      new Error("R2 belum dikonfigurasi. Lengkapi konfigurasi server."),
      { status: 503 },
    );
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
};
export const bucket = process.env.R2_BUCKET || "rekap-tekad";
