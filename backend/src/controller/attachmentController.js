import { compressUpload } from "../utils/compressUpload.js";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { localStorage } from "../utils/localStorage.js";
import { transaction } from "../utils/transaction.js";
import { audit } from "../utils/audit.js";
import { owned } from "../utils/recordAccess.js";
import * as AttachmentModel from "../model/AttachmentModel.js";
export const list = async (req, res) => {
  await transaction((c) => owned(c, req.params.id, req.user));
  const [files] = await AttachmentModel.findForRecord([req.params.id]);
  res.json(files);
};
export const upload = async (req, res) => {
  const kind = z
      .enum(["organization", "building", "proof"])
      .parse(req.body.kind),
    f = req.file;
  if (!f) return res.status(400).json({ message: "Pilih berkas" });
  if (kind === "proof")
    return res
      .status(400)
      .json({
        message:
          "Unggah bukti beserta jenis penerimaan dan keterangannya melalui formulir BUMDes.",
      });
  const b = f.buffer;
  const mime =
    b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
      ? "image/jpeg"
      : b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        ? "image/png"
        : b.subarray(0, 5).toString() === "%PDF-"
          ? "application/pdf"
          : null;
  if (
    !mime ||
    (kind === "proof" ? mime !== "application/pdf" : !mime.startsWith("image/"))
  )
    return res.status(400).json({
      message:
        "Foto hanya PNG/JPG/JPEG; bukti penerimaan hanya PDF. Maksimal 2 MB per berkas.",
    });
  const id = randomUUID(),
    key = `assets/${mime === "application/pdf" ? "documents" : "images"}/${req.params.id}/${id}`;
  let written = false;
  try {
    await transaction(async (c) => {
      await owned(c, req.params.id, req.user);
      const compressed = await compressUpload(b, mime);
      await localStorage.put(key, compressed);
      written = true;
      await AttachmentModel.create(
        [id, req.params.id, kind, key, f.originalname.slice(0, 255), mime],
        c,
      );
      await audit(c, req.user.id, "Unggah lampiran", "bumdes", req.params.id, {
        filename: f.originalname,
        kind,
        originalBytes: b.length,
        storedBytes: compressed.length,
      });
    });
  } catch (error) {
    if (written) await localStorage.remove(key);
    throw error;
  }
  res.status(201).json({ id });
};
export const download = async (req, res) => {
  const [files] = await AttachmentModel.findAccessible([
    req.params.id,
    req.user.role,
    req.user.id,
  ]);
  if (!files.length)
    return res.status(404).json({ message: "Berkas tidak ditemukan" });
  const f = files[0];
  await transaction((c) => owned(c, f.record_id, req.user));
  const body = await localStorage.get(f.object_key);
  if (!req.params.content) {
    return res.json({ url: `/api/files/${f.id}/content` });
  }
  res.set("Cache-Control", "private, no-store");
  res.attachment(f.filename);
  res.type(f.mime).send(body);
};
export const remove = async (req, res) => {
  await transaction(async (c) => {
    const [files] = await AttachmentModel.findByIdForUpdate([req.params.id], c);
    if (!files.length)
      throw Object.assign(new Error("Berkas tidak ditemukan"), { status: 404 });
    const f = files[0];
    const record = await owned(c, f.record_id, req.user);
    if (record.data.receipts?.some((r) => r.proofId === f.id))
      throw Object.assign(
        new Error(
          "Bukti wajib tidak dapat dihapus. Ganti bukti melalui formulir penerimaan.",
        ),
        { status: 409 },
      );
    await localStorage.remove(f.object_key);
    await AttachmentModel.remove([f.id], c);
    await audit(c, req.user.id, "Hapus lampiran", "bumdes", f.record_id, {
      filename: f.filename,
    });
  });
  res.json({ ok: true });
};
