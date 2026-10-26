import test from "node:test";
import assert from "node:assert/strict";
import { decodeJsonColumn, jsonTypeCast } from "../src/utils/json.js";
test("MySQL and MariaDB JSON values preserve Unicode and objects", () => {
  const source = {
    fullName: "Petugas Nusa Tenggara Timur",
    address: "Jl. Desa – Kantor",
  };
  assert.deepEqual(decodeJsonColumn(JSON.stringify(source), "profile"), source);
  assert.deepEqual(decodeJsonColumn(source, "profile"), source);
});
test("SQL numeric or text boolean statuses normalize correctly", () => {
  for (const received of [0, "false"])
    assert.equal(
      decodeJsonColumn(JSON.stringify({ received }), "data").received,
      false,
    );
  for (const received of [1, "true"])
    assert.equal(
      decodeJsonColumn(JSON.stringify({ received }), "data").received,
      true,
    );
});
test("Type cast affects only application JSON columns", () => {
  assert.equal(
    jsonTypeCast({ name: "username" }, () => "admin_demo"),
    "admin_demo",
  );
  assert.equal(
    jsonTypeCast({ name: "profile", string: () => null }, () => {}),
    null,
  );
  assert.deepEqual(
    jsonTypeCast(
      { name: "owner", string: () => '{"fullName":"Admin"}' },
      () => {},
    ),
    { fullName: "Admin" },
  );
});
