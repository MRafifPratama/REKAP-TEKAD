// Runs only against an explicitly configured isolated test database.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { db } from "../src/config/database.js";
if (!process.env.DB_NAME?.endsWith("_test"))
  throw new Error("Set DB_NAME ending in _test; never run against user data.");
const base = `http://127.0.0.1:${process.env.PORT || 3000}/api`,
  origin = "http://127.0.0.1:8000";
async function call(path, method = "GET", body, cookie = "", expected = 200) {
  const r = await fetch(base + path, {
    method,
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const value = await r.json();
  assert.equal(r.status, expected, JSON.stringify(value));
  return { value, cookie: r.headers.get("set-cookie")?.split(";")[0] };
}
const unique = randomBytes(4).toString("hex"),
  pw = "TestPassword2026!",
  profile = {
    username: "test_" + unique,
    fullName: "Petugas Pengujian",
    email: unique + "@example.test",
    phone: "081234567890",
    address: "Alamat uji",
    provinceCode: "53",
    regencyCode: "53.01",
    districtCode: "53.01.04",
    villageCode: "53.01.04.2003",
    province: "Papua",
    regency: "Jayapura",
    district: "Sentani",
    village: "Desa Pengujian",
  };
try {
  await db.execute(
    "INSERT IGNORE INTO wilayah (kode,nama) VALUES ('53','Nusa Tenggara Timur'),('53.01','Kabupaten Kupang'),('53.01.04','Semau'),('53.01.04.2003','Bokonusan')",
  );
  const rejected = await fetch(base + "/auth/logout", {
    method: "POST",
    headers: { Origin: "https://untrusted.example" },
  });
  assert.equal(rejected.status, 403);
  await call("/records", "GET", null, "", 401);
  await call(
    "/auth/register",
    "POST",
    { ...profile, password: pw, role: "admin" },
    "",
    201,
  );
  const { cookie, value: user } = await call("/auth/login", "POST", {
    username: profile.username,
    password: pw,
  });
  assert.equal(user.role, "user");
  await call("/users", "GET", null, cookie, 403);
  const r = {
    provinceCode: "53",
    regencyCode: "53.01",
    districtCode: "53.01.04",
    villageCode: "53.01.04.2003",
    province: "Papua",
    regency: "Jayapura",
    district: "Sentani",
    village: "Desa Pengujian",
    name: "BUMDes Uji",
    address: "Alamat uji",
    contactName: "Kontak Uji",
    contactEmail: "kontak@example.test",
    contactPhone: "081234567890",
    management: "Direktur: Kontak Uji",
    location: "https://maps.google.com/?q=-2,140",
    products: "Kopi",
    received: false,
    receivedDate: "",
    amount: 0,
  };
  const { value: created } = await call("/records", "POST", r, cookie, 201);
  const { value: rows } = await call("/records", "GET", null, cookie);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].data.name, r.name);
  await call("/records", "POST", r, cookie, 409);
  const mine = await call("/records/mine", "GET", null, cookie);
  assert.equal(mine.value.record.id, created.id);
  await call(
    "/records/" + created.id,
    "PUT",
    { ...r, name: "BUMDes Uji Revisi", version: 1 },
    cookie,
  );
  await call(
    "/records/" + created.id,
    "PUT",
    { ...r, version: 1 },
    cookie,
    409,
  );
  const second = {
    ...profile,
    username: profile.username + "_b",
    email: "b" + profile.email,
  };
  await call("/auth/register", "POST", { ...second, password: pw }, "", 201);
  const { cookie: other } = await call("/auth/login", "POST", {
    username: second.username,
    password: pw,
  });
  assert.equal((await call("/records", "GET", null, other)).value.length, 0);
  await call("/records/" + created.id, "PUT", { ...r, version: 2 }, other, 404);
  await call("/records/" + created.id + "/files", "GET", null, other, 404);
  await call("/records/" + created.id, "DELETE", null, other, 403);
  const { value: logs } = await call("/logs", "GET", null, cookie);
  assert.ok(logs.some((l) => l.changes.before && l.changes.after));
  assert.ok(logs.every((l) => l.user_id === user.id));
  await call(
    "/me/password",
    "PUT",
    { currentPassword: pw, newPassword: "UpdatedPassword2026!" },
    cookie,
  );
  await call("/me", "GET", null, cookie, 401);
  const { cookie: newCookie } = await call("/auth/login", "POST", {
    username: profile.username,
    password: "UpdatedPassword2026!",
  });
  await call("/records/" + created.id, "DELETE", null, newCookie, 403);
  const { cookie: adminCookie } = await call("/auth/login", "POST", {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
  });
  await call("/records/" + created.id, "DELETE", null, adminCookie);
  assert.equal(
    (await call("/records", "GET", null, newCookie)).value.length,
    0,
  );
  const target = {
    ...profile,
    username: "managed_" + unique,
    email: "managed_" + profile.email,
    password: pw,
    role: "user",
    active: true,
  };
  await call("/users", "POST", target, adminCookie, 201);
  const { value: users } = await call("/users", "GET", null, adminCookie);
  const managed = users.find((u) => u.username === target.username);
  const { cookie: managedCookie } = await call("/auth/login", "POST", {
    username: managed.username,
    password: pw,
  });
  await call(
    "/users/" + managed.id,
    "PUT",
    { ...managed, active: false },
    adminCookie,
  );
  await call(
    "/auth/login",
    "POST",
    { username: managed.username, password: pw },
    "",
    401,
  );
  await call("/me", "GET", null, managedCookie, 401);
  const self = users.find(
    (u) => u.role === "admin" && u.username === process.env.ADMIN_USERNAME,
  );
  await call(
    "/users/" + self.id,
    "PUT",
    { ...self, active: false },
    adminCookie,
    400,
  );
  await call("/users/" + managed.id, "DELETE", null, adminCookie);
  assert.ok(
    !(await call("/users", "GET", null, adminCookie)).value.some(
      (u) => u.id === managed.id,
    ),
  );
  console.log(
    "PASS: authentication, immediate registration, role protection, user isolation, CRUD, version conflict, change log, password session revocation, admin CRUD, account deactivation.",
  );
} finally {
  await db.end();
}
