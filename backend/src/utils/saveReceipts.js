import { randomUUID } from "node:crypto";
import { receiptsOf } from "./receipts.js";
import { compressUpload } from "./compressUpload.js";
import { localStorage } from "./localStorage.js";
import * as AttachmentModel from "../model/AttachmentModel.js";
const reject = (message) => Object.assign(new Error(message), { status: 400 });
export async function saveReceipts(c, recordId, data, old, files, written) {
  const previous = receiptsOf(old || {});
  const receipts = data.receipts || [];
  if (!data.receipts && data.received)
    throw reject("Lengkapi jenis penerimaan dan bukti pada formulir terbaru.");
  for (const r of previous)
    if (!receipts.some((next) => next.id === r.id))
      throw reject(
        "Penerimaan yang tersimpan tidak dapat dihilangkan dari formulir.",
      );
  const supplied = new Map();
  for (const file of files || []) {
    if (
      supplied.has(file.fieldname) ||
      !receipts.some((r) => r.id === file.fieldname)
    )
      throw reject("Lampiran tidak sesuai dengan penerimaan.");
    supplied.set(file.fieldname, file);
  }
  for (const receipt of receipts) {
    const prior = previous.find((r) => r.id === receipt.id);
    const file = supplied.get(receipt.id);
    if (!file) {
      if (!prior?.proofId || receipt.proofId !== prior.proofId)
        throw reject(
          "Setiap penerimaan wajib memiliki bukti PDF. Pilih bukti untuk penerimaan yang belum lengkap.",
        );
      const [rows] = await AttachmentModel.findByIdForUpdate(
        [receipt.proofId],
        c,
      );
      if (
        !rows.length ||
        rows[0].record_id !== recordId ||
        rows[0].kind !== "proof"
      )
        throw reject("Bukti penerimaan tidak ditemukan.");
      continue;
    }
    if (file.buffer.subarray(0, 5).toString() !== "%PDF-")
      throw reject("Bukti penerimaan hanya boleh PDF.");
    const buffer = await compressUpload(file.buffer, "application/pdf");
    const id = randomUUID();
    const key = `assets/documents/${recordId}/${id}`;
    await localStorage.put(key, buffer);
    written.push(key);
    await AttachmentModel.create(
      [
        id,
        recordId,
        "proof",
        key,
        file.originalname.slice(0, 255),
        "application/pdf",
      ],
      c,
    );
    receipt.proofId = id;
  }
}
