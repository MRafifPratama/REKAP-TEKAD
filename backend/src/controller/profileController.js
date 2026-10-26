import bcrypt from "bcryptjs";
import { z } from "zod";
import { profile, password } from "../utils/validation.js";
import { resolveRegion } from "../utils/regions.js";
import { audit } from "../utils/audit.js";
import { transaction } from "../utils/transaction.js";
import { publicUser } from "../utils/security.js";
import * as SessionModel from "../model/SessionModel.js";
import * as UserModel from "../model/UserModel.js";
export const show = (req, res) => res.json(publicUser(req.user));
export const update = async (req, res) => {
  const p = await resolveRegion(profile.parse(req.body));
  await transaction(async (c) => {
    await UserModel.updateProfile(
      [p.username, p.email, JSON.stringify(p), req.user.id],
      c,
    );
    await audit(c, req.user.id, "Ubah profil", "pengguna", req.user.id, {
      before: req.user.profile,
      after: p,
    });
  });
  res.json({ ...publicUser(req.user), ...p });
};
export const changePassword = async (req, res) => {
  const v = z
    .object({ currentPassword: z.string().max(128), newPassword: password })
    .parse(req.body);
  if (!(await bcrypt.compare(v.currentPassword, req.user.password_hash)))
    return res.status(400).json({ message: "Password saat ini salah" });
  await transaction(async (c) => {
    await UserModel.updatePassword(
      [await bcrypt.hash(v.newPassword, 12), req.user.id],
      c,
    );
    await SessionModel.deleteForUser([req.user.id], c);
    await audit(c, req.user.id, "Ganti password", "pengguna", req.user.id);
  });
  res
    .clearCookie("tekad_session", { path: "/api" })
    .json({ message: "Password diperbarui. Silakan masuk kembali." });
};
