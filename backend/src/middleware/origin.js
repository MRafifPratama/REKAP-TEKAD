import { frontendOrigins } from "../config/env.js";
export function checkOrigin(req, res, next) {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    !frontendOrigins.includes(req.headers.origin)
  )
    return res.status(403).json({ message: "Origin tidak diizinkan" });
  next();
}
