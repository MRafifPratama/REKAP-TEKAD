import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { receiptSchema, summarize, receiptsOf } from "../src/utils/receipts.js";
import { saveReceipts } from "../src/utils/saveReceipts.js";
import { localStorage } from "../src/utils/localStorage.js";
const receipt = () => ({
  id: randomUUID(),
  type: "demplot",
  date: "2026-01-10",
  amount: 100,
  description: "Bukti transfer",
  proofId: "",
});
test("Receipt types, dates, positive amounts and description are validated", () => {
  for (const type of ["demplot", "ritd", "investment"])
    assert.ok(receiptSchema.safeParse({ ...receipt(), type }).success);
  for (const patch of [
    { type: "other" },
    { description: " " },
    { date: "2026-02-30" },
    { amount: 0 },
  ])
    assert.ok(!receiptSchema.safeParse({ ...receipt(), ...patch }).success);
  const summary = summarize({
    receipts: [receipt(), { ...receipt(), amount: 200, date: "2026-02-10" }],
  });
  assert.equal(summary.amount, 300);
  assert.equal(summary.received, true);
  assert.equal(summary.receivedDate, "2026-02-10");
});
test("No new receipt can be saved without a PDF; existing evidence cannot be borrowed", async () => {
  const r = receipt(),
    db = {
      execute: async () => {
        throw new Error("Unexpected query");
      },
    };
  await assert.rejects(saveReceipts(db, 1, { receipts: [r] }, null, [], []), {
    status: 400,
  });
  await assert.rejects(
    saveReceipts(
      db,
      1,
      { receipts: [r] },
      null,
      [{ fieldname: r.id, buffer: Buffer.from("fake png") }],
      [],
    ),
    { status: 400 },
  );
  const old = { receipts: [{ ...r, proofId: randomUUID() }] };
  await assert.rejects(
    saveReceipts(
      { execute: async () => [[{ record_id: 2, kind: "proof" }]] },
      1,
      old,
      old,
      [],
      [],
    ),
    { status: 400 },
  );
  await assert.rejects(saveReceipts(db, 1, { receipts: [] }, old, [], []), {
    status: 400,
  });
});
test("Two receipts save different PDF evidence with independent descriptions", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage().drawText("Bukti uji");
  const buffer = Buffer.from(await pdf.save());
  const receipts = [
    receipt(),
    { ...receipt(), type: "ritd", description: "Bukti kedua" },
  ];
  const writes = [],
    inserts = [];
  const db = {
    execute: async (sql, values) => {
      inserts.push(values);
      return [{ affectedRows: 1 }];
    },
  };
  try {
    await saveReceipts(
      db,
      99999999,
      { receipts },
      null,
      receipts.map((r) => ({
        fieldname: r.id,
        originalname: "bukti.pdf",
        buffer,
      })),
      writes,
    );
    assert.equal(inserts.length, 2);
    assert.notEqual(receipts[0].proofId, receipts[1].proofId);
    assert.equal(receipts[1].description, "Bukti kedua");
    for (const key of writes)
      assert.ok((await localStorage.get(key)).length <= 1048576);
  } finally {
    await Promise.all(writes.map((key) => localStorage.remove(key)));
  }
});
test("Legacy receipt is retained without inventing an aid type", () => {
  const legacy = receiptsOf({
    received: true,
    receivedDate: "2026-01-01",
    amount: 500,
  });
  assert.equal(legacy.length, 1);
  assert.equal(legacy[0].amount, 500);
  assert.equal(legacy[0].type, "");
});
