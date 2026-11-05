import { saveReceipts } from "../utils/saveReceipts.js";
import { localStorage } from "../utils/localStorage.js";
import { ensureCanCreate, ensureCanDelete } from "../utils/singleRecord.js";
import { z } from "zod";
import { record } from "../utils/validation.js";
import { resolveRegion } from "../utils/regions.js";
import { audit } from "../utils/audit.js";
import { transaction } from "../utils/transaction.js";
import { owned } from "../utils/recordAccess.js";
import * as RecordModel from "../model/RecordModel.js";
import * as AttachmentModel from "../model/AttachmentModel.js";
export const list = async (req, res) => {
  const [rows] = await RecordModel.findForUser(req.user);
  res.json(rows);
};
async function save(req, res, updating) {
  let input;
  try {
    input = req.body.data ? JSON.parse(req.body.data) : req.body;
  } catch {
    throw Object.assign(new Error("Format data tidak valid"), { status: 400 });
  }
  const data = await resolveRegion(record.parse(input));
  const written = [];
  let id;
  try {
    id = await transaction(async (c) => {
      let old;
      let recordId;
      if (updating) {
        old = await owned(c, req.params.id, req.user);
        if (old.version !== z.number().int().positive().parse(input.version))
          throw Object.assign(
            new Error("Data telah berubah. Muat ulang sebelum menyimpan."),
            { status: 409 },
          );
        recordId = old.id;
      } else {
        await ensureCanCreate(c, req.user);
        const [result] = await RecordModel.create(
          [req.user.id, JSON.stringify(data)],
          c,
        );
        recordId = result.insertId;
      }
      await saveReceipts(c, recordId, data, old?.data, req.files, written);
      if (updating || data.receipts?.length)
        await RecordModel.update([JSON.stringify(data), recordId], c);
      await audit(
        c,
        req.user.id,
        updating ? "Ubah data" : "Tambah data",
        "bumdes",
        recordId,
        { ...(old ? { before: old.data } : {}), after: data },
      );
      return recordId;
    });
  } catch (error) {
    await Promise.allSettled(written.map((key) => localStorage.remove(key)));
    throw error;
  }
  res.status(updating ? 200 : 201).json({ id });
}
export const create = (req, res) => save(req, res, false);
export const update = (req, res) => save(req, res, true);
export const remove = async (req, res) => {
  ensureCanDelete(req.user);
  const staged = [];
  try {
    await transaction(async (c) => {
      const old = await owned(c, req.params.id, req.user);
      const [files] = await AttachmentModel.findForDeletion([old.id], c);
      for (const file of files) {
        const pending = await localStorage.stageRemove(file.object_key);
        if (pending) staged.push(pending);
      }
      await AttachmentModel.removeForRecord([old.id], c);
      await RecordModel.remove([old.id], c);
      await audit(c, req.user.id, "Hapus data", "bumdes", old.id, {
        before: old.data,
        attachments: files.map(({ id, filename }) => ({ id, filename })),
      });
    });
  } catch (error) {
    const restored = await Promise.allSettled(
      staged.map((file) => file.restore()),
    );
    if (restored.some((result) => result.status === "rejected"))
      console.error(
        "Gagal memulihkan lampiran setelah penghapusan dibatalkan.",
      );
    throw error;
  }
  // The database has committed. Quarantined files are no longer downloadable.
  const cleaned = await Promise.allSettled(staged.map((file) => file.finish()));
  if (cleaned.some((result) => result.status === "rejected"))
    console.error(
      "Pembersihan berkas .deleting- tertunda setelah penghapusan BUMDes.",
    );
  res.json({ ok: true });
};

export const mine = async (req, res) => {
  const [rows] = await RecordModel.findPrimaryForUser(req.user.id);
  const [count] = await RecordModel.countForUser(req.user.id);
  res.json({
    record: rows[0] || null,
    additionalCount: Math.max(0, Number(count[0].total) - 1),
  });
};
