import { db } from "../config/database.js";
export function findActiveUserByHash(values = [], connection = db) {
  return connection.execute(
    "SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE token_hash=? AND expires_at>UTC_TIMESTAMP() AND u.active=1 AND u.deleted_at IS NULL",
    values,
  );
}
export function deleteExpired(values = [], connection = db) {
  return connection.execute(
    "DELETE FROM sessions WHERE expires_at<=UTC_TIMESTAMP()",
    values,
  );
}
export function create(values = [], connection = db) {
  return connection.execute(
    "INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 8 HOUR))",
    values,
  );
}
export function findByHash(values = [], connection = db) {
  return connection.execute(
    "SELECT user_id FROM sessions WHERE token_hash=?",
    values,
  );
}
export function deleteByHash(values = [], connection = db) {
  return connection.execute("DELETE FROM sessions WHERE token_hash=?", values);
}
export function deleteForUser(values = [], connection = db) {
  return connection.execute("DELETE FROM sessions WHERE user_id=?", values);
}
