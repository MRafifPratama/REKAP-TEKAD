import test from "node:test";
import assert from "node:assert/strict";
import { errorHandler } from "../src/middleware/errorHandler.js";
function handle(error) {
  let status, body;
  const res = {
    status(code) {
      status = code;
      return this;
    },
    json(value) {
      body = value;
      return this;
    },
  };
  errorHandler(error, {}, res, () => {});
  return { status, body };
}
test("Database access failure gives actionable configuration error without leaking server details", () => {
  const r = handle({
    code: "ER_DBACCESS_DENIED_ERROR",
    message: "PRIVATE_CONNECTION_DETAILS",
  });
  assert.equal(r.status, 503);
  assert.match(r.body.message, /backend\/\.env/);
  assert.ok(!JSON.stringify(r.body).includes("PRIVATE_CONNECTION_DETAILS"));
});
test("Disconnected XAMPP produces service unavailable rather than invalid-password response", () => {
  const r = handle({ code: "ECONNREFUSED" });
  assert.equal(r.status, 503);
  assert.match(r.body.message, /XAMPP/);
});
test("Missing region table points to relocated import files", () => {
  const r = handle({
    code: "ER_NO_SUCH_TABLE",
    sqlMessage: "Table 'rekap_tekad.wilayah' doesn't exist",
  });
  assert.equal(r.status, 503);
  assert.match(r.body.message, /backend\/database\/02_wilayah\.sql/);
});
