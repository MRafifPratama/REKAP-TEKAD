import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { db } from "../src/config/database.js";
import { remove } from "../src/controller/recordController.js";
import { createLocalStorage, localStorage } from "../src/utils/localStorage.js";

test("Admin deletes receipts and attachments; failed transaction restores files", async () => {
  const root = await mkdtemp(join(tmpdir(), "tekad-delete-"));
  const storage = createLocalStorage(root);
  const original = db.getConnection;
  const stageRemove = localStorage.stageRemove;
  localStorage.stageRemove = storage.stageRemove;
  try {
    for (const fail of [false, true]) {
      const key = "assets/images/17/12345678-1234-1234-1234-123456789abc";
      const missingKey =
        "assets/documents/17/12345678-1234-1234-1234-123456789abc";
      await storage.put(key, Buffer.from("proof"));
      const queries = [];
      let committed = false,
        rolledBack = false;
      db.getConnection = async () => ({
        beginTransaction: async () => {},
        commit: async () => {
          if (fail) throw new Error("Commit failed");
          committed = true;
        },
        rollback: async () => {
          rolledBack = true;
        },
        release() {},
        execute: async (sql, values) => {
          queries.push(sql);
          if (sql.startsWith("SELECT * FROM records"))
            return [
              [
                {
                  id: 17,
                  user_id: 2,
                  data: { receipts: [{ proofId: "proof" }] },
                },
              ],
            ];
          if (sql.startsWith("SELECT id,object_key"))
            return [
              [
                { id: "proof", object_key: key, filename: "proof.jpg" },
                {
                  id: "missing",
                  object_key: missingKey,
                  filename: "missing.pdf",
                },
              ],
            ];
          return [{ affectedRows: 1 }];
        },
      });
      let response;
      const request = { user: { id: 1, role: "admin" }, params: { id: "17" } };
      const result = remove(request, {
        json: (value) => {
          response = value;
        },
      });
      if (fail) {
        await assert.rejects(result, /Commit failed/);
        assert.equal(rolledBack, true);
        assert.deepEqual(await storage.get(key), Buffer.from("proof"));
        assert.equal(response, undefined);
        await storage.remove(key);
      } else {
        await result;
        assert.equal(committed, true);
        assert.deepEqual(response, { ok: true });
        await assert.rejects(storage.get(key), { status: 404 });
      }
      assert(queries.some((sql) => sql.startsWith("DELETE FROM attachments")));
      assert(queries.some((sql) => sql.startsWith("DELETE FROM records")));
      assert(
        queries.some((sql) => sql.startsWith("INSERT INTO activity_logs")),
      );
    }
    await assert.rejects(
      remove({ user: { id: 2, role: "user" }, params: { id: "17" } }, {}),
      { status: 403 },
    );
  } finally {
    db.getConnection = original;
    localStorage.stageRemove = stageRemove;
    await rm(root, { recursive: true, force: true });
  }
});
