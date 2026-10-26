// For a fresh local MySQL installation. Uses root only for provisioning.
import mysql from "mysql2/promise";
import { readFile, writeFile, chmod, access } from "node:fs/promises";
import { randomBytes } from "node:crypto";
const path = new URL("../.env", import.meta.url);
let source = await readFile(path, "utf8");
function set(k, v) {
  source = source.match(new RegExp("^" + k + "=", "m"))
    ? source.replace(new RegExp("^" + k + "=.*$", "m"), k + "=" + v)
    : source + "\n" + k + "=" + v;
  process.env[k] = v;
}
const dbPassword =
  process.env.DB_PASSWORD || randomBytes(24).toString("base64url");
const adminPassword =
  process.env.ADMIN_PASSWORD || "Aa1!" + randomBytes(18).toString("base64url");
const rootPassword =
  process.env.MYSQL_ROOT_PASSWORD || randomBytes(24).toString("base64url");
let socket = new URL("../.local-mysql/mysql.sock", import.meta.url).pathname;
try {
  await access(socket);
} catch {
  socket = "/tmp/mysql.sock";
}
const root = await mysql.createConnection({
  socketPath: process.env.MYSQL_SOCKET || socket,
  user: "root",
  password: process.env.MYSQL_ROOT_PASSWORD || "",
});
try {
  for (const name of [
    "rekap_tekad",
    ...(process.argv.includes("--with-tests") ? ["rekap_tekad_test"] : []),
  ]) {
    await root.query(
      "CREATE DATABASE IF NOT EXISTS ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
      [name],
    );
    await root.query(
      "CREATE USER IF NOT EXISTS 'rekap_app'@'127.0.0.1' IDENTIFIED BY ?",
      [dbPassword],
    );
    await root.query(
      "GRANT SELECT,INSERT,UPDATE,DELETE,CREATE,REFERENCES ON ??.* TO 'rekap_app'@'127.0.0.1'",
      [name],
    );
  }
  set("DB_USER", "rekap_app");
  set("DB_PASSWORD", dbPassword);
  set("ADMIN_PASSWORD", adminPassword);
  set("MYSQL_ROOT_PASSWORD", rootPassword);
  await writeFile(path, source, { mode: 0o600 });
  await chmod(path, 0o600);
  if (!process.env.MYSQL_ROOT_PASSWORD_INITIALIZED) {
    await root.query("ALTER USER 'root'@'localhost' IDENTIFIED BY ?", [
      rootPassword,
    ]);
  }
  if (process.argv.includes("--with-tests")) {
    let test = source
      .replace(/^DB_NAME=.*$/m, "DB_NAME=rekap_tekad_test")
      .replace(/^PORT=.*$/m, "PORT=3001")
      .replace(/^R2_ACCESS_KEY_ID=.*$/m, "R2_ACCESS_KEY_ID=")
      .replace(/^MYSQL_ROOT_PASSWORD=.*$/m, "")
      .replace(/^R2_SECRET_ACCESS_KEY=.*$/m, "R2_SECRET_ACCESS_KEY=");
    await writeFile(new URL("../.env.test", import.meta.url), test, {
      mode: 0o600,
    });
  }
  console.log(
    "Database dan akun lokal siap. Kredensial tersimpan hanya di .env (akses file 600).",
  );
} finally {
  await root.end();
}
