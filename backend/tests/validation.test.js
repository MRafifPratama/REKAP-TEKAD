import test from "node:test";
import assert from "node:assert/strict";
import { registration, record, password } from "../src/utils/validation.js";
const p = {
  username: "petugas",
  fullName: "Petugas Desa",
  email: "desa@example.com",
  phone: "081234567890",
  address: "Jalan Desa",
  provinceCode: "53",
  regencyCode: "53.01",
  districtCode: "53.01.04",
  villageCode: "53.01.04.2003",
  province: "Papua",
  regency: "Jayapura",
  district: "Sentani",
  village: "Desa A",
  password: "AmanSekali2026!",
};
const r = {
  provinceCode: "53",
  regencyCode: "53.01",
  districtCode: "53.01.04",
  villageCode: "53.01.04.2003",
  province: "Papua",
  regency: "Jayapura",
  district: "Sentani",
  village: "Desa A",
  name: "BUMDes Maju",
  address: "Jalan Desa",
  contactName: "Petugas Desa",
  contactEmail: "desa@example.com",
  contactPhone: "081234567890",
  management: "Direktur: Budi",
  location: "https://maps.google.com/?q=-2,140",
  products: "Kopi",
  received: false,
  receivedDate: "",
  amount: 0,
};
test("Registration requires complete identity and safe password", () => {
  assert.ok(registration.safeParse(p).success);
  assert.ok(!registration.safeParse({ ...p, password: "123" }).success);
  assert.ok(!registration.safeParse({ ...p, email: "bad" }).success);
  assert.ok(!registration.safeParse({ ...p, village: "" }).success);
});
test("Registration cannot set administrator role", () => {
  assert.equal(registration.parse({ ...p, role: "admin" }).role, undefined);
});
test("Record enforces status, amount and year consistency", () => {
  assert.ok(record.safeParse(r).success);
  assert.ok(!record.safeParse({ ...r, received: true }).success);
  assert.ok(
    record.safeParse({
      ...r,
      received: true,
      receivedDate: "2026-01-10",
      amount: 50000000,
    }).success,
  );
  assert.ok(
    !record.safeParse({
      ...r,
      received: true,
      receivedDate: "2025-01-10",
      amount: 50000000,
    }).success,
  );
  assert.ok(!record.safeParse({ ...r, amount: 100 }).success);
});
test("Maps links reject executable and non-Google URLs", () => {
  for (const location of [
    "javascript:alert(1)",
    "https://evil.example/",
    "https://www.google.com.evil.test/",
  ])
    assert.ok(!record.safeParse({ ...r, location }).success);
});
test("Password bounds prevent excessive password input", () => {
  assert.ok(!password.safeParse("A1" + "x".repeat(200)).success);
});

test("Rejects calendar overflow dates", () => {
  assert.ok(
    !record.safeParse({
      ...r,
      received: true,
      receivedDate: "2026-02-30",
      amount: 100,
    }).success,
  );
});
