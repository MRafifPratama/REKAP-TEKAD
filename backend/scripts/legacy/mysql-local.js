import { access, mkdir, readdir } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
const root = path.resolve(".local-mysql");
const options = [
  process.env.MYSQL_BINARY,
  path.join(root, "runtime/bin/mysqld"),
  "/opt/homebrew/opt/mysql/bin/mysqld",
].filter(Boolean);
let binary;
for (const candidate of options) {
  try {
    await access(candidate);
    binary = candidate;
    break;
  } catch {}
}
if (!binary)
  throw new Error(
    "Server MySQL belum tersedia. Pasang MySQL atau isi MYSQL_BINARY dengan path mysqld.",
  );
process.umask(0o077);
await mkdir(path.join(root, "data"), { recursive: true, mode: 0o700 });
const args = [
  "--no-defaults",
  `--basedir=${path.dirname(path.dirname(binary))}`,
  `--datadir=${root}/data`,
  `--socket=${root}/mysql.sock`,
  "--port=3306",
  "--bind-address=127.0.0.1",
  "--mysqlx=OFF",
  `--log-error=${root}/mysql.log`,
];
try {
  await access(path.join(root, "data/mysql"));
} catch {
  if ((await readdir(path.join(root, "data"))).length)
    throw new Error(
      "Direktori data berisi file tetapi belum terinisialisasi. Periksa .local-mysql/mysql.log; jangan timpa data.",
    );
  const init = spawnSync(binary, [...args, "--initialize-insecure"], {
    stdio: "inherit",
  });
  if (init.status !== 0) process.exit(init.status || 1);
}
const child = spawn(binary, args, { stdio: "inherit" });
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("error", (e) => {
  console.error(e.message);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code || 0;
});
console.log(
  "MySQL lokal: 127.0.0.1:3306; data persisten di .local-mysql/data.",
);
