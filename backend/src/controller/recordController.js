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
export const create = async (req, res) => {
  const data = await resolveRegion(record.parse(req.body));
  const id = await transaction(async (c) => {
    await ensureCanCreate(c, req.user);
    const [r] = await RecordModel.create(
      [req.user.id, JSON.stringify(data)],
      c,
    );
    await audit(c, req.user.id, "Tambah data", "bumdes", r.insertId, {
      after: data,
    });
    return r.insertId;
  });
  res.status(201).json({ id });
};
export const update = async (req, res) => {
  const data = await resolveRegion(record.parse(req.body)),
    version = z.number().int().positive().parse(req.body.version);
  await transaction(async (c) => {
    const old = await owned(c, req.params.id, req.user);
    if (old.version !== version)
      throw Object.assign(
        new Error("Data telah berubah. Muat ulang sebelum menyimpan."),
        { status: 409 },
      );
    await RecordModel.update([JSON.stringify(data), old.id], c);
    await audit(c, req.user.id, "Ubah data", "bumdes", old.id, {
      before: old.data,
      after: data,
    });
  });
  res.json({ ok: true });
};
export const remove = async (req, res) => {
  ensureCanDelete(req.user);
  await transaction(async (c) => {
    const old = await owned(c, req.params.id, req.user);
    const [files] = await AttachmentModel.findIdsForRecord([old.id], c);
    if (files.length)
      throw Object.assign(
        new Error("Hapus lampiran terlebih dahulu sebelum menghapus data."),
        { status: 409 },
      );
    await RecordModel.remove([old.id], c);
    await audit(c, req.user.id, "Hapus data", "bumdes", old.id, {
      before: old.data,
    });
  });
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
