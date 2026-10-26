// Smoke check against the existing local app. Creates login/logout audit events only;
// does not register users or change any BUMDes/profile/password data.
import assert from "node:assert/strict";
const base = "http://127.0.0.1:8000/api",
  origin = "http://127.0.0.1:8000";
async function request(
  path,
  { method = "GET", body, cookie = "", expected = 200 } = {},
) {
  const response = await fetch(base + path, {
    method,
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const value = await response.json();
  assert.equal(response.status, expected, JSON.stringify(value));
  return { value, cookie: response.headers.get("set-cookie")?.split(";")[0] };
}
let adminCookie = "",
  userCookie = "";
try {
  assert.equal((await request("/health")).value.database, "connected");
  const { value: provinces } = await request("/regions");
  assert.ok(provinces.length > 0);
  await request("/auth/login", {
    method: "POST",
    body: { username: "admin_demo", password: "wrong-password" },
    expected: 401,
  });
  await request("/auth/login", {
    method: "POST",
    body: { username: "nonaktif_demo", password: "DemoTekad2026!" },
    expected: 401,
  });
  const admin = await request("/auth/login", {
    method: "POST",
    body: { username: "admin_demo", password: "DemoTekad2026!" },
  });
  adminCookie = admin.cookie;
  assert.ok(adminCookie);
  assert.equal(admin.value.role, "admin");
  assert.equal(typeof admin.value.fullName, "string");
  assert.equal(
    (await request("/me", { cookie: adminCookie })).value.id,
    admin.value.id,
  );
  const { value: users } = await request("/users", { cookie: adminCookie });
  assert.ok(Array.isArray(users));
  const { value: allRecords } = await request("/records", {
    cookie: adminCookie,
  });
  assert.ok(
    allRecords.every(
      (r) => typeof r.data === "object" && typeof r.data.received === "boolean",
    ),
  );
  const { value: logs } = await request("/logs", { cookie: adminCookie });
  assert.ok(Array.isArray(logs));
  const user = await request("/auth/login", {
    method: "POST",
    body: { username: "petugas_ntt_demo", password: "DemoTekad2026!" },
  });
  userCookie = user.cookie;
  assert.equal(user.value.role, "user");
  const { value: own } = await request("/records", { cookie: userCookie });
  assert.ok(own.every((r) => r.user_id === user.value.id));
  assert.ok(own.length <= 1);
  const { value: mine } = await request("/records/mine", {
    cookie: userCookie,
  });
  assert.equal(mine.record?.id, own[0]?.id);
  if (mine.record) {
    await request("/records", {
      method: "POST",
      cookie: userCookie,
      body: mine.record.data,
      expected: 409,
    });
    await request("/records/" + mine.record.id, {
      method: "DELETE",
      cookie: userCookie,
      expected: 403,
    });
  }
  await request("/users", { cookie: userCookie, expected: 403 });
  const other = allRecords.find((r) => r.user_id !== user.value.id);
  if (other)
    await request("/records/" + other.id + "/files", {
      cookie: userCookie,
      expected: 404,
    });
  await request("/auth/logout", { method: "POST", cookie: adminCookie });
  await request("/me", { cookie: adminCookie, expected: 401 });
  adminCookie = "";
  console.log(
    JSON.stringify(
      {
        result: "PASS",
        loginAdmin: true,
        loginUser: true,
        sessionPersists: true,
        logoutRevokesSession: true,
        inactiveAccountRejected: true,
        incorrectPasswordRejected: true,
        userIsolation: true,
        singleRecordOnly: true,
        duplicateSubmissionRejected: true,
        userDeleteRejected: true,
        adminOnlyAccess: true,
        provinceCount: provinces.length,
        records: allRecords.length,
        userRecords: own.length,
        received: allRecords.filter((r) => r.data.received).length,
        totalAid: allRecords.reduce(
          (n, r) => n + (r.data.received ? r.data.amount : 0),
          0,
        ),
      },
      null,
      2,
    ),
  );
} finally {
  if (adminCookie)
    await request("/auth/logout", { method: "POST", cookie: adminCookie });
  if (userCookie)
    await request("/auth/logout", { method: "POST", cookie: userCookie });
}
