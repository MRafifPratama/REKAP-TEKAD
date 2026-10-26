// Uploads only generated test fixtures. All files created by this check are removed.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const base = "http://127.0.0.1:8000/api",
  origin = "http://127.0.0.1:8000";
const created = [];
let cookie = "",
  otherCookie = "",
  recordId;
async function request(
  path,
  { method = "GET", body, session = cookie, expected = 200 } = {},
) {
  const multipart = body instanceof FormData;
  const r = await fetch(base + path, {
    method,
    headers: {
      Origin: origin,
      Cookie: session,
      ...(multipart ? {} : { "Content-Type": "application/json" }),
    },
    body: multipart ? body : body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(60000),
  });
  const value = await r.json();
  assert.equal(r.status, expected, JSON.stringify(value));
  return { value, cookie: r.headers.get("set-cookie")?.split(";")[0] };
}
function form(kind, bytes, mime, name) {
  const data = new FormData();
  data.append("kind", kind);
  data.append("file", new Blob([bytes], { type: mime }), name);
  return data;
}
function testPdf() {
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 100 100] /Contents 4 0 R >>",
    "<< /Length 0 >>\nstream\n\nendstream",
  ];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf +=
    "xref\n0 5\n0000000000 65535 f \n" +
    offsets
      .slice(1)
      .map((n) => String(n).padStart(10, "0") + " 00000 n \n")
      .join("") +
    `trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}
try {
  assert.equal(
    (await request("/health", { session: "" })).value.storage,
    true,
    "Backend belum memuat konfigurasi R2. Jalankan ulang backend.",
  );
  const login = await request("/auth/login", {
    method: "POST",
    session: "",
    body: { username: "petugas_ntt_demo", password: "DemoTekad2026!" },
  });
  cookie = login.cookie;
  const { value: mine } = await request("/records/mine");
  assert.ok(mine.record, "Akun demo memerlukan data BUMDes tersimpan.");
  recordId = mine.record.id;
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1ioAAAAASUVORK5CYII=",
    "base64",
  );
  const fixtures = [
    {
      kind: "building",
      mime: "image/png",
      name: "uji-r2-" + randomUUID() + ".png",
      bytes: png,
    },
    {
      kind: "proof",
      mime: "application/pdf",
      name: "uji-r2-" + randomUUID() + ".pdf",
      bytes: testPdf(),
    },
  ];
  for (const f of fixtures) {
    const { value: upload } = await request("/records/" + recordId + "/files", {
      method: "POST",
      body: form(f.kind, f.bytes, f.mime, f.name),
      expected: 201,
    });
    created.push(upload.id);
    const { value: files } = await request("/records/" + recordId + "/files");
    assert.ok(
      files.some(
        (row) =>
          row.id === upload.id &&
          row.filename === f.name &&
          row.kind === f.kind,
      ),
    );
    const { value: signed } = await request("/files/" + upload.id);
    const response = await fetch(signed.url, {
      signal: AbortSignal.timeout(60000),
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), f.mime);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), f.bytes);
  }
  otherCookie = (
    await request("/auth/login", {
      method: "POST",
      session: "",
      body: { username: "petugas_papua_demo", password: "DemoTekad2026!" },
    })
  ).cookie;
  await request("/files/" + created[0], {
    session: otherCookie,
    expected: 404,
  });
  await request("/records/" + recordId + "/files", {
    method: "POST",
    session: otherCookie,
    body: form("building", png, "image/png", "uji-akses.png"),
    expected: 404,
  });
  await request("/records/" + recordId + "/files", {
    method: "POST",
    body: form(
      "building",
      Buffer.from("not an image"),
      "image/png",
      "tidak-valid.png",
    ),
    expected: 400,
  });
  for (const id of [...created]) {
    await request("/files/" + id, { method: "DELETE" });
    created.splice(created.indexOf(id), 1);
    await request("/files/" + id, { expected: 404 });
  }
  console.log(
    JSON.stringify(
      {
        result: "PASS",
        bucket: "rekap-tekad",
        imageUpload: true,
        pdfUpload: true,
        metadataSaved: true,
        signedDownloadBytesMatch: true,
        otherUserAccessRejected: true,
        invalidFileRejected: true,
        temporaryFilesRemoved: true,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error("Uji unggahan gagal:", error.message);
  process.exitCode = 1;
} finally {
  for (const id of created) {
    try {
      await request("/files/" + id, { method: "DELETE" });
    } catch {
      console.error(
        "Lampiran uji belum dapat dibersihkan; periksa berkas berawalan uji-r2 pada BUMDes akun demo.",
      );
      process.exitCode = 1;
    }
  }
  for (const session of [cookie, otherCookie].filter(Boolean)) {
    try {
      await request("/auth/logout", { method: "POST", session });
    } catch {}
  }
}
