import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, stat, mkdir, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLocalStorage } from "../src/utils/localStorage.js";
const key = "assets/images/17/12345678-1234-1234-1234-123456789abc";
test("Private local storage writes, reads, refuses overwrite, and removes objects", async () => {
  const root = await mkdtemp(join(tmpdir(), "tekad-test-"));
  const storage = createLocalStorage(root);
  try {
    await storage.ready();
    const body = Buffer.from("test fixture");
    await storage.put(key, body);
    assert.deepEqual(await storage.get(key), body);
    assert.equal((await stat(join(root, key))).mode & 0o777, 0o600);
    await assert.rejects(storage.put(key, body), { code: "EEXIST" });
    await assert.rejects(storage.put(key, Buffer.alloc(1048577)), {
      status: 413,
    });
    for (const bad of [
      "../secret",
      "/etc/passwd",
      "assets/images/17/../../secret",
    ])
      await assert.rejects(storage.get(bad), { status: 400 });
    await storage.remove(key);
    await assert.rejects(storage.get(key), { status: 404 });
    await storage.remove(key);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test("Storage rejects directories linked outside its private root", async () => {
  const root = await mkdtemp(join(tmpdir(), "tekad-test-"));
  const outside = await mkdtemp(join(tmpdir(), "tekad-outside-"));
  try {
    await mkdir(join(root, "assets/images"), { recursive: true });
    await symlink(outside, join(root, "assets/images/17"));
    await assert.rejects(
      createLocalStorage(root).put(key, Buffer.from("test")),
      { status: 400 },
    );
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});
