import test from "node:test";
import assert from "node:assert/strict";
import {
  regionCodes,
  resolveRegion,
  listRegions,
} from "../src/utils/regions.js";
const value = {
  provinceCode: "53",
  regencyCode: "53.01",
  districtCode: "53.01.04",
  villageCode: "53.01.04.2003",
};
const rows = [
  { kode: "53", nama: "Nusa Tenggara Timur" },
  { kode: "53.01", nama: "Kabupaten Kupang" },
  { kode: "53.01.04", nama: "Semau" },
  { kode: "53.01.04.2003", nama: "Bokonusan" },
];
test("Region hierarchy rejects mixing provinces and villages", () => {
  assert.equal(regionCodes(value).length, 4);
  assert.throws(() => regionCodes({ ...value, provinceCode: "92" }));
  assert.throws(() => regionCodes({ ...value, villageCode: "53.02.04.2003" }));
  assert.throws(() =>
    regionCodes({ ...value, villageCode: "53.01.04.2003' OR 1=1" }),
  );
});
test("Names come from master data rather than submitted labels", async () => {
  const connection = {
    execute: async (sql, params) => {
      assert.deepEqual(params, regionCodes(value));
      return [rows];
    },
  };
  const result = await resolveRegion(
    { ...value, province: "Nama palsu" },
    connection,
  );
  assert.equal(result.province, "Nusa Tenggara Timur");
  assert.equal(result.village, "Bokonusan");
});
test("Unknown region cannot be saved", async () => {
  await assert.rejects(
    resolveRegion(value, { execute: async () => [rows.slice(0, 3)] }),
    /tidak ditemukan/,
  );
});
test("Children endpoint uses parameterized parent prefix and exact level length", async () => {
  const connection = {
    execute: async (sql, params) => {
      assert.deepEqual(params, ["53.01.%", 8]);
      return [[]];
    },
  };
  await listRegions("53.01", connection);
  await assert.rejects(listRegions("53.%", connection), /tidak valid/);
  await assert.rejects(listRegions("53.01.04.2003", connection), /tidak valid/);
});
