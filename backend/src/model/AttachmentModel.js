import { db } from "../config/database.js";
export function findIdsForRecord(values = [], connection = db) {
  return connection.execute(
    "SELECT id FROM attachments WHERE record_id=?",
    values,
  );
}
export function findForRecord(values = [], connection = db) {
  return connection.execute(
    "SELECT id,kind,filename,created_at FROM attachments WHERE record_id=?",
    values,
  );
}
export function create(values = [], connection = db) {
  return connection.execute(
    "INSERT INTO attachments (id,record_id,kind,object_key,filename,mime) VALUES (?,?,?,?,?,?)",
    values,
  );
}
export function findAccessible(values = [], connection = db) {
  return connection.execute(
    "SELECT a.* FROM attachments a JOIN records r ON r.id=a.record_id WHERE a.id=? AND (?='admin' OR r.user_id=?)",
    values,
  );
}
export function findByIdForUpdate(values = [], connection = db) {
  return connection.execute(
    "SELECT * FROM attachments WHERE id=? FOR UPDATE",
    values,
  );
}
export function remove(values = [], connection = db) {
  return connection.execute("DELETE FROM attachments WHERE id=?", values);
}
