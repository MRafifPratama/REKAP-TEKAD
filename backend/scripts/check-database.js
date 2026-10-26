import "../src/config/env.js";
import { db } from "../src/config/database.js";
import bcrypt from "bcryptjs";
try {
  const [info] = await db.query(
    "SELECT DATABASE() AS database_name,VERSION() AS version,CURRENT_USER() AS account",
  );
  const [tables] = await db.query("SHOW TABLES");
  const names = tables.map((r) => Object.values(r)[0]);
  const required = [
    "users",
    "records",
    "sessions",
    "attachments",
    "activity_logs",
    "wilayah",
  ];
  const missing = required.filter((name) => !names.includes(name));
  if (missing.length)
    throw new Error("Tabel belum tersedia: " + missing.join(", "));
  const [count] = await db.query("SELECT COUNT(*) AS total FROM wilayah");
  const [users] = await db.execute(
    "SELECT username,role,active,password_hash FROM users WHERE username=?",
    ["admin_demo"],
  );
  const user = users[0];
  console.log(
    JSON.stringify(
      {
        ...info[0],
        tables: required,
        regions: count[0].total,
        demoAdmin: user
          ? {
              username: user.username,
              role: user.role,
              active: !!user.active,
              passwordMatches: await bcrypt.compare(
                "DemoTekad2026!",
                user.password_hash,
              ),
            }
          : null,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error("Pemeriksaan database gagal:", error.code || "", error.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
