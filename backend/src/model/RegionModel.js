import { db } from "../config/database.js";
export function findByCodes(codes, connection = db) {
  return connection.execute(
    "SELECT kode,nama FROM wilayah WHERE kode IN (?,?,?,?)",
    codes,
  );
}
export function findProvinces(connection = db) {
  return connection.query(
    "SELECT kode,nama FROM wilayah WHERE CHAR_LENGTH(kode)=2 ORDER BY nama",
  );
}
export function findChildren(parent, length, connection = db) {
  return connection.execute(
    "SELECT kode,nama FROM wilayah WHERE kode LIKE ? AND CHAR_LENGTH(kode)=? ORDER BY nama",
    [parent + ".%", length],
  );
}
