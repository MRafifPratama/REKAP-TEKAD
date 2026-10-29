import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { db } from "../src/config/database.js";
import { create } from "../src/controller/recordController.js";
import { localStorage } from "../src/utils/localStorage.js";
// Database calls are replaced by a transaction spy: no database is contacted.
test("Receipt creation commits both proofs together; failure rolls back and cleans disk", async (t) => {
  const execute = db.execute,
    getConnection = db.getConnection;
  const pdf = await PDFDocument.create();
  pdf.addPage();
  const buffer = Buffer.from(await pdf.save());
  const receipt = () => ({
    id: randomUUID(),
    type: "demplot",
    date: "2026-01-10",
    amount: 100,
    description: "Bukti uji",
    proofId: "",
  });
  const data = {
    provinceCode: "53",
    regencyCode: "53.01",
    districtCode: "53.01.04",
    villageCode: "53.01.04.2003",
    province: "P",
    regency: "K",
    district: "C",
    village: "D",
    name: "BUMDes Uji",
    address: "Alamat uji",
    contactName: "Kontak",
    contactEmail: "test@example.com",
    contactPhone: "081234567890",
    management: "Pengurus",
    location: "https://maps.google.com/?q=test",
    products: "Kopi",
    received: false,
    receivedDate: "",
    amount: 0,
  };
  db.execute = async (sql, codes) => [
    codes.map((kode) => ({ kode, nama: "Wilayah uji" })),
  ];
  try {
    for (const fail of [false, true]) {
      let committed = false,
        rolledBack = false,
        saved;
      const keys = [];
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
          if (sql.startsWith("INSERT INTO records"))
            return [{ insertId: 99999998 }];
          if (sql.startsWith("INSERT INTO attachments")) keys.push(values[3]);
          if (sql.startsWith("UPDATE records")) saved = JSON.parse(values[0]);
          return [{ affectedRows: 1 }];
        },
      });
      const receipts = [
        receipt(),
        { ...receipt(), type: "investment", amount: 200 },
      ];
      const req = {
        user: { id: 1, role: "admin" },
        body: { data: JSON.stringify({ ...data, receipts }) },
        files: receipts.slice(0, fail ? 1 : 2).map((r) => ({
          fieldname: r.id,
          originalname: "bukti.pdf",
          buffer,
        })),
      };
      const res = {
        status(value) {
          this.code = value;
          return this;
        },
        json(value) {
          this.value = value;
        },
      };
      try {
        if (fail) {
          await assert.rejects(create(req, res), { status: 400 });
          assert.equal(rolledBack, true);
          assert.equal(committed, false);
          for (const key of keys)
            await assert.rejects(localStorage.get(key), { status: 404 });
        } else {
          await create(req, res);
          assert.equal(committed, true);
          assert.equal(res.code, 201);
          assert.equal(saved.receipts.length, 2);
          assert.equal(saved.amount, 300);
          assert.ok(saved.receipts.every((r) => r.proofId));
        }
      } finally {
        await Promise.all(keys.map((key) => localStorage.remove(key)));
      }
    }
  } finally {
    db.execute = execute;
    db.getConnection = getConnection;
  }
});
