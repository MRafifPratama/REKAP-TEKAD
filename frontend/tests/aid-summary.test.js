import test from "node:test";
import assert from "node:assert/strict";
import {
  aidSummary,
  matchesAidType,
  monthlyAidSummary,
} from "../src/lib/aidSummary.js";
const records = [
  {
    data: {
      received: true,
      receipts: [
        { type: "demplot", amount: 100 },
        { type: "demplot", amount: 200 },
        { type: "ritd", amount: 50 },
      ],
    },
  },
  {
    data: {
      received: true,
      receipts: [
        { type: "investment", amount: 300 },
        { type: "ritd", amount: 100 },
      ],
    },
  },
  { data: { received: true, amount: 400, receivedDate: "2026-01-01" } },
  { data: { received: false, receipts: [] } },
];
test("Aid summary counts a BUMDes once per type and sums each receipt", () => {
  const summary = aidSummary(records);
  assert.deepEqual(
    summary.map(({ type, recipients, receipts, amount }) => ({
      type,
      recipients,
      receipts,
      amount,
    })),
    [
      { type: "demplot", recipients: 1, receipts: 2, amount: 300 },
      { type: "ritd", recipients: 2, receipts: 2, amount: 150 },
      { type: "investment", recipients: 1, receipts: 1, amount: 300 },
    ],
  );
  assert.ok(aidSummary([]).every((r) => r.recipients === 0 && r.amount === 0));
});
test("Aid filter supports overlapping types and retains unclassified legacy data", () => {
  assert.equal(records.filter((r) => matchesAidType(r.data, "all")).length, 4);
  assert.equal(records.filter((r) => matchesAidType(r.data, "ritd")).length, 2);
  assert.equal(
    records.filter((r) => matchesAidType(r.data, "investment")).length,
    1,
  );
  assert.equal(
    records.filter((r) => matchesAidType(r.data, "unclassified")).length,
    1,
  );
  assert.equal(matchesAidType(records[3].data, "demplot"), false);
});

test("Monthly chart groups receipt events by month, retaining legacy and unclassified aid", () => {
  const result = monthlyAidSummary([
    {
      data: {
        receipts: [
          { type: "demplot", date: "2026-01-02" },
          { type: "demplot", date: "2026-01-20" },
          { type: "ritd", date: "2026-02-02" },
          { type: "ritd", date: "2025-01-01" },
          { type: "ritd", date: "bad" },
        ],
      },
    },
    { data: { received: true, receivedDate: "2026-01-01", amount: 100 } },
  ]);
  assert.equal(result.length, 12);
  assert.equal(result[0].demplot, 2);
  assert.equal(result[0].unclassified, 1);
  assert.equal(result[0].total, 3);
  assert.equal(result[1].ritd, 1);
  assert.equal(result[1].total, 1);
  assert.equal(result[11].total, 0);
  assert.ok(monthlyAidSummary([]).every((row) => row.total === 0));
});
