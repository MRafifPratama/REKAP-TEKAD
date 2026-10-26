import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
export const envPath = fileURLToPath(new URL("../../.env", import.meta.url));
dotenv.config({ path: envPath, quiet: true });
export const frontendOrigins = (
  process.env.FRONTEND_ORIGINS || "http://127.0.0.1:8000,http://localhost:8000"
)
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);
