import * as SessionModel from "../model/SessionModel.js";
import { hash } from "../utils/security.js";
export async function auth(req, res, next) {
  const token = req.cookies.tekad_session;
  if (!token) return res.status(401).json({ message: "Silakan masuk" });
  const [rows] = await SessionModel.findActiveUserByHash([hash(token)]);
  if (!rows.length)
    return res
      .status(401)
      .json({ message: "Sesi berakhir. Silakan masuk kembali." });
  req.user = rows[0];
  next();
}
