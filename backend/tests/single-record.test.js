import test from "node:test";
import assert from "node:assert/strict";
import { ensureCanCreate, ensureCanDelete } from "../src/utils/singleRecord.js";
import { owned } from "../src/utils/recordAccess.js";
const user = { id: 7, role: "user" };
test("Existing data rejects new submissions after locking the user account", async () => {
  const order = [];
  const connection = {};
  const models = {
    users: {
      findByIdForUpdate: async (ids, c) => {
        assert.equal(c, connection);
        assert.deepEqual(ids, [7]);
        order.push("account lock");
        return [[{ active: 1 }]];
      },
    },
    records: {
      findPrimaryForUser: async (id, c, lock) => {
        order.push("record check");
        assert.equal(lock, true);
        return [[{ id: 11 }]];
      },
    },
  };
  await assert.rejects(
    ensureCanCreate(connection, user, models),
    (e) => e.status === 409,
  );
  assert.deepEqual(order, ["account lock", "record check"]);
});
test("Concurrent first submissions serialize on the account and only one may create", async () => {
  let tail = Promise.resolve();
  const rows = [];
  const models = {
    users: {
      findByIdForUpdate: async (ids, c) => {
        const previous = tail;
        let release;
        tail = new Promise((r) => (release = r));
        await previous;
        c.release = release;
        return [[{ active: 1 }]];
      },
    },
    records: { findPrimaryForUser: async () => [rows.slice()] },
  };
  async function submit() {
    const c = {};
    try {
      await ensureCanCreate(c, user, models);
      rows.push({ id: 1 });
      return 1;
    } finally {
      c.release?.();
    }
  }
  const results = await Promise.allSettled([submit(), submit()]);
  assert.equal(rows.length, 1);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(results.find((r) => r.status === "rejected").reason.status, 409);
});
test("Inactive account cannot submit and administrators retain management access", async () => {
  await assert.rejects(
    ensureCanCreate({}, user, {
      users: { findByIdForUpdate: async () => [[{ active: 0 }]] },
    }),
    (e) => e.status === 403,
  );
  await ensureCanCreate({}, { id: 1, role: "admin" }, {});
});
test("Users cannot delete their permanent form", () => {
  assert.throws(
    () => ensureCanDelete(user),
    (e) => e.status === 403,
  );
  assert.doesNotThrow(() => ensureCanDelete({ role: "admin" }));
});
test("Legacy extra record cannot be edited by its old user, but remains available to admin", async () => {
  const model = {
    findForUpdate: async () => [[{ id: 12, user_id: 7 }]],
    findPrimaryForUser: async () => [[{ id: 11, user_id: 7 }]],
  };
  await assert.rejects(owned({}, 12, user, model), (e) => e.status === 404);
  assert.equal((await owned({}, 12, { id: 1, role: "admin" }, model)).id, 12);
  model.findForUpdate = async () => [[{ id: 11, user_id: 7 }]];
  assert.equal((await owned({}, 11, user, model)).id, 11);
});
