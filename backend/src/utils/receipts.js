import { z } from "zod";
export const receiptSchema = z.object({
  id: z.uuid().or(z.literal("legacy")),
  type: z.enum(["demplot", "ritd", "investment"]),
  date: z
    .string()
    .regex(/^2026-\d{2}-\d{2}$/)
    .refine(
      (v) =>
        !isNaN(Date.parse(v)) &&
        new Date(v).toISOString().slice(0, 10) === v &&
        v <= new Date().toISOString().slice(0, 10),
      "Tanggal penerimaan tidak valid",
    ),
  amount: z.number().int().positive().max(999999999999),
  description: z
    .string()
    .trim()
    .min(1, "Keterangan bukti wajib diisi")
    .max(2000),
  proofId: z.uuid().or(z.literal("")).optional(),
});
export function receiptsOf(data) {
  return (
    data.receipts ??
    (data.received
      ? [
          {
            id: "legacy",
            type: "",
            date: data.receivedDate,
            amount: data.amount,
            description: "",
            proofId: "",
          },
        ]
      : [])
  );
}
export function summarize(data) {
  if (!data.receipts) return data;
  return {
    ...data,
    received: data.receipts.length > 0,
    amount: data.receipts.reduce((sum, r) => sum + r.amount, 0),
    receivedDate:
      data.receipts
        .map((r) => r.date)
        .sort()
        .at(-1) || "",
  };
}
