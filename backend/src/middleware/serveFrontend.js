import express from "express";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, extname } from "node:path";
export function serveFrontend(
  root = fileURLToPath(new URL("../../../frontend/dist/", import.meta.url)),
) {
  const router = express.Router();
  router.use((req, res, next) => {
    if (req.path === "/api" || req.path.startsWith("/api/"))
      return next("router");
    next();
  });
  router.use(express.static(root, { index: "index.html", dotfiles: "deny" }));
  router.use((req, res, next) => {
    if (
      !["GET", "HEAD"].includes(req.method) ||
      extname(req.path) ||
      req.path.split("/").some((part) => part.startsWith(".")) ||
      !req.accepts("html")
    )
      return next();
    const index = join(root, "index.html");
    if (!existsSync(index)) {
      return res
        .status(503)
        .json({
          message:
            "Frontend belum dibangun. Jalankan npm run build dari root proyek, lalu deploy ulang.",
        });
    }
    res.sendFile(index);
  });
  return router;
}
