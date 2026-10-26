import bcrypt from "bcryptjs";
import { z } from "zod";
import { profile, registration } from "../utils/validation.js";
import { resolveRegion } from "../utils/regions.js";
import { audit } from "../utils/audit.js";
import { transaction } from "../utils/transaction.js";
import { publicUser } from "../utils/security.js";
import * as SessionModel from "../model/SessionModel.js";
import * as UserModel from "../model/UserModel.js";
export const list = async (req, res) => {
  const [rows] = await UserModel.findAll([]);
  res.json(rows.map(publicUser));
};
export const create = async (req, res) => {
  const v = await resolveRegion(
      registration
        .extend({ role: z.enum(["admin", "user"]), active: z.boolean() })
        .parse(req.body),
    ),
    { password: pw, role, active, ...p } = v;
  await transaction(async (c) => {
    const [r] = await UserModel.createManaged(
      [
        p.username,
        p.email,
        await bcrypt.hash(pw, 12),
        role,
        active,
        JSON.stringify(p),
      ],
      c,
    );
    await audit(c, req.user.id, "Tambah pengguna", "pengguna", r.insertId, {
      after: { ...p, role, active },
    });
  });
  res.status(201).json({ ok: true });
};
export const update = async (req, res) => {
  const v = await resolveRegion(
    profile
      .extend({ role: z.enum(["admin", "user"]), active: z.boolean() })
      .parse(req.body),
  );
  await transaction(async (c) => {
    const [rows] = await UserModel.findByIdForUpdate([req.params.id], c);
    if (!rows.length)
      throw Object.assign(new Error("Pengguna tidak ditemukan"), {
        status: 404,
      });
    if (
      Number(req.params.id) === req.user.id &&
      (!v.active || v.role !== "admin")
    )
      throw Object.assign(
        new Error(
          "Tidak dapat menonaktifkan atau menurunkan peran akun sendiri",
        ),
        { status: 400 },
      );
    if (rows[0].role === "admin" && (!v.active || v.role !== "admin")) {
      const [admins] = await UserModel.findActiveAdminsForUpdate([], c);
      if (admins.length <= 1)
        throw Object.assign(
          new Error("Minimal satu admin aktif harus tersedia"),
          { status: 409 },
        );
    }
    const { role, active, ...p } = v;
    await UserModel.updateManaged(
      [p.username, p.email, role, active, JSON.stringify(p), req.params.id],
      c,
    );
    if (rows[0].role !== role || !!rows[0].active !== active)
      await SessionModel.deleteForUser([req.params.id], c);
    await audit(c, req.user.id, "Ubah pengguna", "pengguna", req.params.id, {
      before: publicUser(rows[0]),
      after: v,
    });
  });
  res.json({ ok: true });
};
export const remove = async (req, res) => {
  if (Number(req.params.id) === req.user.id)
    return res
      .status(400)
      .json({ message: "Akun sendiri tidak dapat dihapus" });
  await transaction(async (c) => {
    const [rows] = await UserModel.findByIdForUpdate([req.params.id], c);
    if (!rows.length)
      throw Object.assign(new Error("Pengguna tidak ditemukan"), {
        status: 404,
      });
    if (rows[0].role === "admin" && rows[0].active) {
      const [admins] = await UserModel.findActiveAdminsForUpdate([], c);
      if (admins.length <= 1)
        throw Object.assign(
          new Error("Minimal satu admin aktif harus tersedia"),
          { status: 409 },
        );
    }
    await UserModel.archive([req.params.id], c);
    await SessionModel.deleteForUser([req.params.id], c);
    await audit(c, req.user.id, "Hapus pengguna", "pengguna", req.params.id, {
      before: publicUser(rows[0]),
    });
  });
  res.json({ ok: true });
};
