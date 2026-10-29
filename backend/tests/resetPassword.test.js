import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { db } from "../src/config/database.js";
import { resetPassword } from "../src/controller/userController.js";
import { admin } from "../src/middleware/requireAdmin.js";
test("Admin reset validates password, hashes it, revokes sessions and logs no credentials", async () => {
  const original = db.getConnection;
  let rows = [{ id: 7, role: "user" }],
    calls = [],
    committed = false,
    rolledBack = false;
  db.getConnection = async () => ({
    beginTransaction: async () => {},
    commit: async () => {
      committed = true;
    },
    rollback: async () => {
      rolledBack = true;
    },
    release() {},
    execute: async (sql, values) => {
      calls.push({ sql, values });
      return sql.startsWith("SELECT") ? [rows] : [{ affectedRows: 1 }];
    },
  });
  const password = "PasswordBaru2026!";
  const req = {
    user: { id: 1, role: "admin" },
    params: { id: "7" },
    body: { newPassword: password, confirmPassword: password },
  };
  const res = {
    json(value) {
      this.value = value;
    },
  };
  try {
    await resetPassword(req, res);
    assert.equal(committed, true);
    const update = calls.find((c) =>
      c.sql.startsWith("UPDATE users SET password_hash"),
    );
    assert.ok(await bcrypt.compare(password, update.values[0]));
    assert.ok(
      calls.some(
        (c) => c.sql.startsWith("DELETE FROM sessions") && c.values[0] === "7",
      ),
    );
    const log = calls.find((c) =>
      c.sql.startsWith("INSERT INTO activity_logs"),
    );
    assert.equal(log.values[0], 1);
    assert.equal(log.values[1], "Reset password pengguna");
    assert.equal(log.values[4], "{}");
    await assert.rejects(
      resetPassword(
        { ...req, body: { newPassword: "short", confirmPassword: "short" } },
        res,
      ),
    );
    await assert.rejects(
      resetPassword(
        {
          ...req,
          body: { newPassword: password, confirmPassword: "different" },
        },
        res,
      ),
    );
    rows = [];
    await assert.rejects(resetPassword(req, res), { status: 404 });
    rows = [{ id: 7, role: "admin" }];
    await assert.rejects(resetPassword(req, res), { status: 400 });
    assert.equal(rolledBack, true);
  } finally {
    db.getConnection = original;
  }
});
test("Ordinary users cannot pass the admin middleware for reset", () => {
  let status,
    next = false;
  const res = {
    status(value) {
      status = value;
      return this;
    },
    json() {},
  };
  admin({ user: { role: "user" } }, res, () => {
    next = true;
  });
  assert.equal(status, 403);
  assert.equal(next, false);
});
