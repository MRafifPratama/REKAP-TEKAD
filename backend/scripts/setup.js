import { readFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import { db } from "../src/config/database.js";
import { password } from "../src/utils/validation.js";
try {
  for (const sql of (
    await readFile(new URL("../database/schema.sql", import.meta.url), "utf8")
  )
    .split(";")
    .filter((x) => x.trim()))
    await db.query(sql);
  if (process.env.ADMIN_PASSWORD) {
    password.parse(process.env.ADMIN_PASSWORD);
    const [u] = await db.execute("SELECT id FROM users WHERE username=?", [
      process.env.ADMIN_USERNAME || "admin",
    ]);
    if (!u.length) {
      const username = process.env.ADMIN_USERNAME || "admin",
        email = process.env.ADMIN_EMAIL;
      await db.execute(
        "INSERT INTO users (username,email,password_hash,role,profile) VALUES (?,?,?,?,?)",
        [
          username,
          email,
          await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
          "admin",
          JSON.stringify({
            username,
            email,
            fullName: "Administrator TEKAD",
            phone: "080000000000",
            address: "Kantor Kemendesa",
            province: "DKI Jakarta",
            regency: "Jakarta Selatan",
            district: "Pancoran",
            village: "Kalibata",
          }),
        ],
      );
      console.log("Admin berhasil dibuat.");
    }
  }
  console.log("Skema database siap.");
} finally {
  await db.end();
}
