import { z } from "zod";
const text = z.string().trim().min(1, "Wajib diisi").max(255);
export const regionFields = {
  provinceCode: z.string().regex(/^\d{2}$/),
  regencyCode: z.string().regex(/^\d{2}\.\d{2}$/),
  districtCode: z.string().regex(/^\d{2}\.\d{2}\.\d{2}$/),
  villageCode: z.string().regex(/^\d{2}\.\d{2}\.\d{2}\.\d{4}$/),
};
export const profile = z.object({
  ...regionFields,
  username: z.string().regex(/^[a-zA-Z0-9_]{3,40}$/),
  fullName: text,
  email: z.email().max(255),
  phone: z.string().regex(/^\+?[0-9 ()-]{8,20}$/),
  address: z.string().trim().min(1).max(2000),
  province: text,
  regency: text,
  district: text,
  village: text,
});
export const password = z
  .string()
  .min(12, "Password minimal 12 karakter")
  .max(128)
  .regex(/[a-z]/, "Gunakan huruf kecil")
  .regex(/[A-Z]/, "Gunakan huruf besar")
  .regex(/[0-9]/, "Gunakan angka")
  .refine(
    (v) => Buffer.byteLength(v, "utf8") <= 72,
    "Password maksimal 72 byte UTF-8",
  );
export const registration = profile.extend({ password });
export const record = z
  .object({
    ...regionFields,
    province: text,
    regency: text,
    district: text,
    village: text,
    name: text,
    address: z.string().trim().min(1).max(2000),
    contactName: text,
    contactEmail: z.email(),
    contactPhone: z.string().regex(/^\+?[0-9 ()-]{8,20}$/),
    management: z.string().trim().min(1).max(5000),
    location: z
      .string()
      .url()
      .max(2000)
      .refine(
        (v) =>
          /^https:\/\/(maps\.google\.com|www\.google\.com|maps\.app\.goo\.gl|goo\.gl)\//.test(
            v,
          ),
        "Gunakan tautan Google Maps HTTPS",
      ),
    products: z.string().trim().min(1).max(5000),
    received: z.boolean(),
    receivedDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .or(z.literal("")),
    amount: z.number().int().min(0).max(999999999999),
  })
  .superRefine((v, c) => {
    if (v.received && (!v.receivedDate || v.amount <= 0))
      c.addIssue({
        code: "custom",
        message: "Tanggal dan jumlah bantuan wajib diisi",
        path: ["amount"],
      });
    if (
      v.receivedDate &&
      (!v.receivedDate.startsWith("2026-") ||
        isNaN(Date.parse(v.receivedDate)) ||
        (!isNaN(Date.parse(v.receivedDate)) &&
          new Date(v.receivedDate).toISOString().slice(0, 10) !==
            v.receivedDate) ||
        v.receivedDate > new Date().toISOString().slice(0, 10))
    )
      c.addIssue({
        code: "custom",
        message: "Tanggal harus valid, tahun 2026, dan tidak di masa depan",
        path: ["receivedDate"],
      });
    if (!v.received && (v.amount !== 0 || v.receivedDate))
      c.addIssue({
        code: "custom",
        message: "Belum menerima: kosongkan tanggal dan jumlah",
        path: ["amount"],
      });
  });
