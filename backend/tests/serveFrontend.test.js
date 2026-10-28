import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { serveFrontend } from "../src/middleware/serveFrontend.js";
test("Production serves React and assets while preserving API 404 and private paths", async () => {
  const dir = await mkdtemp(join(tmpdir(), "tekad-web-"));
  await writeFile(
    join(dir, "index.html"),
    '<html><div id="root">TEKAD</div></html>',
  );
  await writeFile(join(dir, "app.js"), 'console.log("TEKAD")');
  const app = express();
  app.use(serveFrontend(dir));
  app.use((req, res) =>
    res.status(404).json({ message: "Endpoint tidak ditemukan" }),
  );
  const server = app.listen(0, "127.0.0.1");
  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const path of ["/", "/profil"]) {
      const response = await fetch(base + path);
      assert.equal(response.status, 200);
      assert.match(await response.text(), /id="root"/);
    }
    assert.equal((await fetch(base + "/app.js")).status, 200);
    for (const path of ["/api", "/api/missing", "/missing.js", "/.env"])
      assert.equal((await fetch(base + path)).status, 404);
    await rm(join(dir, "index.html"));
    assert.equal((await fetch(base + "/")).status, 503);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});
