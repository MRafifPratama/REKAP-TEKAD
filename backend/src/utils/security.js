import { createHash } from "node:crypto";
export const hash = (v) => createHash("sha256").update(v).digest("hex");
export const publicUser = (u) => ({
  ...u.profile,
  id: u.id,
  role: u.role,
  active: !!u.active,
});
