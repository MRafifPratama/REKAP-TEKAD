import "./env.js";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
const backendRoot = fileURLToPath(new URL("../../", import.meta.url));
export const storageRoot = resolve(
  backendRoot,
  process.env.STORAGE_DIR || "storage/uploads",
);
