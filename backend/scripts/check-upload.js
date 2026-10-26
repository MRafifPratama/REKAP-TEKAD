// Uploads only generated test fixtures. All files created by this check are removed.
import assert from "node:assert/strict";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { randomBytes, randomUUID } from "node:crypto";
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
try {
  assert.equal(
    (await request("/health", { session: "" })).value.storage,
    true,
    "Penyimpanan lokal belum tersedia. Periksa izin folder backend.",
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
  const png = await sharp(randomBytes(800 * 650 * 3), {
    raw: { width: 800, height: 650, channels: 3 },
  })
    .png()
    .toBuffer();
  const pdf = await PDFDocument.create();
  const jpg = await sharp(randomBytes(1200 * 1000 * 3), {
    raw: { width: 1200, height: 1000, channels: 3 },
  })
    .jpeg({ quality: 95 })
    .toBuffer();
  const image = await pdf.embedJpg(jpg);
  pdf.addPage().drawImage(image, { x: 20, y: 50, width: 400, height: 333 });
  const pdfBytes = Buffer.from(await pdf.save());
  const fixtures = [
    {
      kind: "building",
      mime: "image/png",
      name: "uji-local-" + randomUUID() + ".png",
      bytes: png,
    },
    {
      kind: "proof",
      mime: "application/pdf",
      name: "uji-local-" + randomUUID() + ".pdf",
      bytes: pdfBytes,
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
    const response = await fetch(new URL(signed.url, origin), {
      headers: { Cookie: cookie },
      signal: AbortSignal.timeout(60000),
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), f.mime);
    const stored = Buffer.from(await response.arrayBuffer());
    assert.ok(
      f.bytes.length > 1024 * 1024 && f.bytes.length <= 2 * 1024 * 1024,
    );
    assert.ok(stored.length <= 1024 * 1024);
    if (f.kind === "proof")
      assert.equal((await PDFDocument.load(stored)).getPageCount(), 1);
    else assert.equal((await sharp(stored).metadata()).format, "png");
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
  await request("/files/" + created[0] + "/content", {
    session: otherCookie,
    expected: 404,
  });
  await request("/files/" + created[0] + "/content", {
    session: "",
    expected: 401,
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
        storageProvider: "local",
        imageUpload: true,
        pdfUpload: true,
        metadataSaved: true,
        compressedObjectsUnder1MB: true,
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
        "Lampiran uji belum dapat dibersihkan; periksa berkas berawalan uji-local pada BUMDes akun demo.",
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
