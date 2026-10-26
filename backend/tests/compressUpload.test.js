import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { compressUpload, STORAGE_LIMIT } from "../src/utils/compressUpload.js";
test("PNG over 1 MB compresses to readable PNG within storage limit", async () => {
  const input = await sharp(randomBytes(800 * 650 * 3), {
    raw: { width: 800, height: 650, channels: 3 },
  })
    .png()
    .toBuffer();
  assert.ok(input.length > STORAGE_LIMIT && input.length < 2 * STORAGE_LIMIT);
  const output = await compressUpload(input, "image/png");
  assert.ok(output.length <= STORAGE_LIMIT);
  assert.equal((await sharp(output).metadata()).format, "png");
});
test("JPEG remains decodable and never grows", async () => {
  const input = await sharp({
    create: { width: 1000, height: 800, channels: 3, background: "blue" },
  })
    .jpeg()
    .toBuffer();
  const output = await compressUpload(input, "image/jpeg");
  assert.ok(output.length <= input.length);
  assert.equal((await sharp(output).metadata()).format, "jpeg");
});
test("PDF over 1 MB compresses and preserves pages", async () => {
  const doc = await PDFDocument.create();
  doc.addPage().drawText("Bukti penerimaan TEKAD 2026");
  doc.addPage().drawText("Halaman kedua");
  const photo = await sharp(randomBytes(1200 * 1000 * 3), {
    raw: { width: 1200, height: 1000, channels: 3 },
  })
    .jpeg({ quality: 95 })
    .toBuffer();
  const image = await doc.embedJpg(photo);
  doc.getPage(0).drawImage(image, { x: 20, y: 50, width: 400, height: 333 });
  const input = Buffer.from(await doc.save({ useObjectStreams: false }));
  assert.ok(input.length > STORAGE_LIMIT && input.length < 2 * STORAGE_LIMIT);
  const output = await compressUpload(input, "application/pdf");
  assert.ok(output.length <= STORAGE_LIMIT);
  assert.equal((await PDFDocument.load(output)).getPageCount(), 2);
});
test("Files above 2 MB and corrupted documents are rejected", async () => {
  await assert.rejects(
    compressUpload(Buffer.alloc(2 * STORAGE_LIMIT + 1), "image/png"),
    { status: 413 },
  );
  await assert.rejects(
    compressUpload(Buffer.from("%PDF-broken"), "application/pdf"),
    { status: 422 },
  );
  await assert.rejects(
    compressUpload(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), "image/png"),
    { status: 422 },
  );
});
