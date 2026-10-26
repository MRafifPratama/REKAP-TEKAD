import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { registration } from "../utils/validation.js";
import { resolveRegion } from "../utils/regions.js";
import { audit } from "../utils/audit.js";
import { transaction } from "../utils/transaction.js";
import { hash, publicUser } from "../utils/security.js";
import * as SessionModel from "../model/SessionModel.js";
import * as UserModel from "../model/UserModel.js";
export const register = async (req, res) => {
  const v = await resolveRegion(registration.parse(req.body)),
    { password: pw, ...p } = v;
  const id = await transaction(async (c) => {
    const [r] = await UserModel.create(
      [v.username, v.email, await bcrypt.hash(pw, 12), JSON.stringify(p)],
      c,
    );
    await audit(c, r.insertId, "Registrasi", "pengguna", r.insertId);
    return r.insertId;
  });
  res.status(201).json({ id, message: "Akun aktif. Silakan masuk." });
};
export const login = async (req, res) => {
  const v = z
    .object({
      username: z.string().trim().min(1).max(255),
      password: z.string().min(1).max(128),
    })
    .parse(req.body);
  const [rows] = await UserModel.findByUsername([v.username]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(v.password, u.password_hash)) || !u.active)
    return res.status(401).json({
      message: "Username atau password salah, atau akun tidak aktif.",
    });
  const token = randomBytes(32).toString("hex");
  await transaction(async (c) => {
    await SessionModel.deleteExpired([], c);
    await SessionModel.create([hash(token), u.id], c);
    await audit(c, u.id, "Login", "pengguna", u.id);
  });
  res
    .cookie("tekad_session", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 3600000,
      path: "/api",
    })
    .json(publicUser(u));
};
export const logout = async (req, res) => {
  const token = req.cookies.tekad_session;
  if (token)
    await transaction(async (c) => {
      const [rows] = await SessionModel.findByHash([hash(token)], c);
      await SessionModel.deleteByHash([hash(token)], c);
      if (rows.length)
        await audit(c, rows[0].user_id, "Logout", "pengguna", rows[0].user_id);
    });
  res.clearCookie("tekad_session", { path: "/api" }).json({ ok: true });
};
