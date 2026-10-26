import { readFile, writeFile, mkdir } from "node:fs/promises";
import bcrypt from "bcryptjs";
import { password, registration, record } from "../src/utils/validation.js";
const root = new URL("../", import.meta.url),
  file = (p) => new URL(p, root);
const raw = await readFile(file("database/wilayah-sumber.sql"), "utf8");
const entries = [
  ...raw.matchAll(/^\('([0-9.]+)','((?:[^'\\]|\\.|'')*)'\)/gm),
].map((m) => [m[1], m[2].replace(/''/g, "'").replace(/\\(['\\])/g, "$1")]);
const regions = new Map(entries);
if (entries.length !== 91599 || regions.size !== entries.length)
  throw new Error("Jumlah/duplikasi data wilayah tidak sesuai.");
for (const [code, name] of entries) {
  if (
    !/^\d{2}(?:\.\d{2}(?:\.\d{2}(?:\.\d{4})?)?)?$/.test(code) ||
    name.length > 100 ||
    !name ||
    (code.includes(".") && !regions.has(code.slice(0, code.lastIndexOf("."))))
  )
    throw new Error("Hierarki wilayah tidak valid: " + code);
}
const q = (s) =>
  "'" + String(s).replaceAll("\\", "\\\\").replaceAll("'", "''") + "'";
const obj = (v) =>
  "JSON_OBJECT(" +
  Object.entries(v)
    .flatMap(([k, x]) => [
      q(k),
      typeof x === "boolean"
        ? `JSON_EXTRACT('${x ? "true" : "false"}','$')`
        : typeof x === "number"
          ? String(x)
          : q(x),
    ])
    .join(",") +
  ")";
const header =
  "-- Rekap TEKAD: impor pada database rekap_tekad yang sudah tersedia.\n-- Tidak membuat/menghapus database. Tidak menghapus data yang sudah ada.\nSET NAMES utf8mb4;\nSET time_zone = '+00:00';\nUSE rekap_tekad;\n\n";
const regionDDL = `CREATE TABLE IF NOT EXISTS wilayah (\n kode VARCHAR(13) NOT NULL PRIMARY KEY,\n nama VARCHAR(100) NOT NULL,\n INDEX wilayah_name_idx (nama)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n`;
let schema = await readFile(file("database/schema.sql"), "utf8");
schema = schema.replaceAll(
  "\n);",
  "\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",
);
await writeFile(file("database/01_schema.sql"), header + schema);
const license = raw.slice(0, raw.indexOf("*/") + 2);
let regionSQL =
  header +
  license +
  "\n-- Adaptasi: tanpa DROP TABLE; InnoDB; INSERT IGNORE menjaga kode yang sudah ada.\n" +
  regionDDL +
  "\nSTART TRANSACTION;\n";
for (let i = 0; i < entries.length; i += 500) {
  regionSQL +=
    "INSERT IGNORE INTO wilayah (kode,nama) VALUES\n" +
    entries
      .slice(i, i + 500)
      .map(([k, n]) => `(${q(k)},${q(n)})`)
      .join(",\n") +
    ";\n";
}
regionSQL += "COMMIT;\n";
await writeFile(file("database/02_wilayah.sql"), regionSQL);
await mkdir(file("database/wilayah-parts/"), { recursive: true });
for (let part = 0; part < 4; part++) {
  let small = header + license + "\n" + regionDDL + "\nSTART TRANSACTION;\n";
  const portion = entries.slice(part * 25000, (part + 1) * 25000);
  for (let i = 0; i < portion.length; i += 500)
    small +=
      "INSERT IGNORE INTO wilayah (kode,nama) VALUES\n" +
      portion
        .slice(i, i + 500)
        .map(([k, n]) => `(${q(k)},${q(n)})`)
        .join(",\n") +
      ";\n";
  small += "COMMIT;\n";
  await writeFile(
    file(`database/wilayah-parts/02_wilayah_0${part + 1}.sql`),
    small,
  );
}

const demoPassword = "DemoTekad2026!";
password.parse(demoPassword);
const hash = await bcrypt.hash(demoPassword, 12);
const region = (code) => {
  const districtCode = code.slice(0, 8),
    regencyCode = code.slice(0, 5),
    provinceCode = code.slice(0, 2);
  return {
    provinceCode,
    regencyCode,
    districtCode,
    villageCode: code,
    province: regions.get(provinceCode),
    regency: regions.get(regencyCode),
    district: regions.get(districtCode),
    village: regions.get(code),
  };
};
const users = [
  ["admin_demo", "Administrator Demo", "admin", true, "53.01.04.2003"],
  ["petugas_ntt_demo", "Petugas NTT Demo", "user", true, "53.01.04.2003"],
  ["petugas_papua_demo", "Petugas Papua Demo", "user", true, "92.02.03.2001"],
  ["nonaktif_demo", "Pengguna Nonaktif Demo", "user", false, "81.01.01.1009"],
];
let seed =
  header +
  "-- DATA SIMULASI, BUKAN DATA PENERIMA BANTUAN RESMI.\n-- Password semua akun demo: DemoTekad2026!\n-- Tidak mengubah password/peran akun dengan username/email yang sudah ada.\n-- Tidak memasukkan sesi atau referensi berkas R2 fiktif.\nSTART TRANSACTION;\n";
for (const [username, fullName, role, active, code] of users) {
  const p = {
    username,
    fullName,
    email: username + "@example.test",
    phone: "080000000000",
    address: "Alamat simulasi (bukan alamat operasional)",
    ...region(code),
  };
  registration.parse({ ...p, password: demoPassword });
  seed += `\nINSERT IGNORE INTO users (username,email,password_hash,role,active,profile) VALUES (${q(username)},${q(p.email)},${q(hash)},${q(role)},${active ? "TRUE" : "FALSE"},${obj(p)});\n`;
}
const samples = [
  [
    "SIMULASI - BUMDes Bokonusan",
    "53.01.04.2003",
    "petugas_ntt_demo",
    true,
    "2026-05-12",
    50000000,
    "Kopi kemasan; keripik pisang",
  ],
  [
    "SIMULASI - BUMDes Otan",
    "53.01.04.2004",
    "admin_demo",
    false,
    "",
    0,
    "Tenun; jasa penggilingan",
  ],
  [
    "SIMULASI - BUMDes Dindey",
    "92.02.03.2001",
    "petugas_papua_demo",
    true,
    "2026-06-10",
    75000000,
    "Kakao; sayuran",
  ],
  [
    "SIMULASI - BUMDes Indisey",
    "92.02.03.2002",
    "admin_demo",
    true,
    "2026-07-15",
    100000000,
    "Kopi; bibit tanaman",
  ],
  [
    "SIMULASI - BUMDes Hollo",
    "81.01.01.1009",
    "admin_demo",
    false,
    "",
    0,
    "Olahan ikan; kerajinan",
  ],
  [
    "SIMULASI - BUMDes Tamilouw",
    "81.01.01.2001",
    "admin_demo",
    true,
    "2026-08-20",
    60000000,
    "Pala; minyak kelapa",
  ],
];
for (const [
  i,
  [name, code, owner, received, receivedDate, amount, products],
] of samples.entries()) {
  const data = {
    ...region(code),
    name,
    address: "Alamat BUMDes simulasi di " + regions.get(code),
    contactName: "Kontak Simulasi " + (i + 1),
    contactEmail: `kontak${i + 1}@example.test`,
    contactPhone: "080000000000",
    management:
      "SIMULASI\nDirektur: Pengurus Contoh\nSekretaris: Sekretaris Contoh\nBendahara: Bendahara Contoh",
    location:
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(
        regions.get(code) + " " + regions.get(code.slice(0, 5)),
      ),
    products,
    received,
    receivedDate,
    amount,
  };
  record.parse(data);
  seed += `\n-- ${name}\nSET @demo_owner=(SELECT id FROM users WHERE username=${q(owner)} LIMIT 1);\nSET @demo_existing=(SELECT id FROM records WHERE JSON_UNQUOTE(JSON_EXTRACT(data,'$.name'))=${q(name)} LIMIT 1);\nINSERT INTO records (user_id,data,version) SELECT @demo_owner,${obj(data)},1 WHERE @demo_existing IS NULL;\nSET @demo_created=ROW_COUNT();\nSET @demo_record=COALESCE(@demo_existing,LAST_INSERT_ID());\nINSERT INTO activity_logs (user_id,action,entity,entity_id,changes) SELECT @demo_owner,'Tambah data contoh','bumdes',CAST(@demo_record AS CHAR),JSON_OBJECT('source','SQL demo','after',${obj(data)}) WHERE @demo_created=1;\n`;
  if (i === 0) {
    const before = { ...data, received: false, receivedDate: "", amount: 0 };
    seed += `-- Contoh audit perubahan status bantuan pada data simulasi.\nINSERT INTO activity_logs (user_id,action,entity,entity_id,changes) SELECT @demo_owner,'Ubah data contoh','bumdes',CAST(@demo_record AS CHAR),JSON_OBJECT('source','SQL demo','before',${obj(before)},'after',${obj(data)}) WHERE @demo_created=1;\n`;
  }
}
seed += "COMMIT;\n";
await writeFile(file("database/03_contoh_data.sql"), seed);
await writeFile(
  file("database/rekap_tekad.sql"),
  header + schema + "\n" + regionSQL + "\n" + seed,
);
console.log(
  "SQL siap: skema, 91.599 wilayah, 4 akun demo, 6 BUMDes simulasi, dan log. Tidak ada koneksi MySQL yang dijalankan.",
);
