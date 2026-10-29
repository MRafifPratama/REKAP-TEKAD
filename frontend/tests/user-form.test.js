import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
let server, Page, ErrorDialog;
before(async () => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  server = await createServer({
    root,
    configFile: root + "vite.config.js",
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    appType: "custom",
  });
  Page = (await server.ssrLoadModule("/src/UserRecordPage.jsx")).default;
  ErrorDialog = (await server.ssrLoadModule("/src/ErrorDialog.jsx")).default;
});
after(async () => {
  await server?.close();
});
const props = {
  user: { id: 7 },
  additionalCount: 0,
  loadState: "ready",
  action: () => {},
  onReload: () => {},
  busy: false,
};
test("New user gets a complete form without add/list controls", () => {
  const html = renderToStaticMarkup(
    React.createElement(Page, { ...props, record: null }),
  );
  assert.match(html, /Formulir pendataan BUMDes/);
  assert.match(html, /Simpan data BUMDes/);
  assert.match(html, /Profil wilayah/);
  assert.match(html, /Profil BUMDes/);
  assert.match(html, /Penerimaan bantuan TEKAD 2026/);
  assert.equal((html.match(/type="file"/g) || []).length, 2);
  assert.match(html, /Foto bagan pengurus/);
  assert.match(html, /Foto bangunan BUMDes/);
  assert.match(html, /Tambah penerimaan lain/);
  assert.ok(
    html.indexOf('type="file"') < html.lastIndexOf("Simpan data BUMDes"),
  );
  assert.ok(!html.includes("Tambah data"));
});
test("Existing form displays saved values, update action and inline documentation", () => {
  const record = {
    id: 11,
    version: 1,
    data: {
      name: "BUMDes Uji",
      province: "Nusa Tenggara Timur",
      regency: "Kupang",
      district: "Semau",
      village: "Bokonusan",
      management: "Pengurus",
      products: "Kopi",
      received: false,
      amount: 0,
    },
  };
  const html = renderToStaticMarkup(
    React.createElement(Page, { ...props, record, additionalCount: 1 }),
  );
  assert.match(html, /BUMDes Uji/);
  assert.match(html, /Perbarui data BUMDes/);
  assert.match(html, /Dokumentasi &amp; bukti penerimaan/);
  assert.match(html, /data tambahan/);
  assert.ok(!html.includes("Tambah data"));
});
test("Failed initial load cannot render an empty create form over saved data", () => {
  const html = renderToStaticMarkup(
    React.createElement(Page, { ...props, record: null, loadState: "error" }),
  );
  assert.match(html, /Muat ulang data/);
  assert.ok(!html.includes("Simpan data BUMDes"));
});

test("Multiple receipts display their aid types, required proof and descriptions", () => {
  const receipts = [
    {
      id: "a",
      type: "demplot",
      date: "2026-01-10",
      amount: 100,
      description: "Bukti demplot",
      proofId: "",
    },
    {
      id: "b",
      type: "ritd",
      date: "2026-02-10",
      amount: 200,
      description: "Bukti RITD",
      proofId: "",
    },
  ];
  const html = renderToStaticMarkup(
    React.createElement(Page, {
      ...props,
      record: {
        id: 11,
        version: 1,
        data: { receipts, received: true, amount: 300 },
      },
    }),
  );
  assert.match(html, /Penerimaan 1/);
  assert.match(html, /Penerimaan 2/);
  for (const label of [
    "Demonstration Plot (Demplot)",
    "Rumah Inovasi Teknologi Desa (RITD)",
    "Dana Investasi (Investment Fund)",
    "Bukti demplot",
    "Bukti RITD",
    "Keterangan bukti",
  ])
    assert.ok(html.includes(label));
  assert.ok((html.match(/accept=".png,.jpg,.jpeg,.pdf"/g) || []).length >= 2);
});

test("Input errors render an in-page accessible dialog with close controls and escaped text", () => {
  const html = renderToStaticMarkup(
    React.createElement(ErrorDialog, {
      message: "Email salah <script>test</script>",
      onDismiss: () => {},
    }),
  );
  assert.match(html, /role="alertdialog"/);
  assert.match(html, /aria-labelledby="validation-title"/);
  assert.match(html, /Mengerti/);
  assert.match(html, /Tutup pesan kesalahan/);
  assert.ok(!html.includes("<script>"));
  assert.match(html, /&lt;script&gt;/);
});
