import { db } from "../config/database.js";
import * as RegionModel from "../model/RegionModel.js";
const levels = ["province", "regency", "district", "village"];
const bad = (message) => Object.assign(new Error(message), { status: 400 });
export function regionCodes(input) {
  const codes = levels.map((k) => input[k + "Code"]);
  const patterns = [
    /^\d{2}$/,
    /^\d{2}\.\d{2}$/,
    /^\d{2}\.\d{2}\.\d{2}$/,
    /^\d{2}\.\d{2}\.\d{2}\.\d{4}$/,
  ];
  if (!codes.every((c, i) => typeof c === "string" && patterns[i].test(c)))
    throw bad("Pilih seluruh wilayah dari daftar yang tersedia.");
  if (!codes.every((c, i) => i === 0 || c.startsWith(codes[i - 1] + ".")))
    throw bad(
      "Hierarki provinsi, kabupaten, kecamatan, dan desa tidak sesuai.",
    );
  return codes;
}
export async function resolveRegion(input, connection = db) {
  const codes = regionCodes(input);
  const [rows] = await RegionModel.findByCodes(codes, connection);
  const map = new Map(rows.map((r) => [r.kode, r.nama]));
  if (codes.some((c) => !map.has(c)))
    throw bad("Wilayah tidak ditemukan dalam master wilayah.");
  return {
    ...input,
    ...Object.fromEntries(levels.map((k, i) => [k, map.get(codes[i])])),
  };
}
export async function listRegions(parent, connection = db) {
  if (parent === undefined || parent === "") {
    const [rows] = await RegionModel.findProvinces(connection);
    return rows;
  }
  if (
    typeof parent !== "string" ||
    !/^\d{2}(?:\.\d{2}(?:\.\d{2})?)?$/.test(parent)
  )
    throw bad("Kode induk wilayah tidak valid.");
  const length = { 2: 5, 5: 8, 8: 13 }[parent.length];
  const [rows] = await RegionModel.findChildren(parent, length, connection);
  return rows;
}
