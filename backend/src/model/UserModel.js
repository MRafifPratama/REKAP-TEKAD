import { db } from "../config/database.js";
export function create(values = [], connection = db) {
  return connection.execute(
    "INSERT INTO users (username,email,password_hash,profile) VALUES (?,?,?,?)",
    values,
  );
}
export function findByUsername(values = [], connection = db) {
  return connection.execute(
    "SELECT * FROM users WHERE username=? AND deleted_at IS NULL",
    values,
  );
}
export function updateProfile(values = [], connection = db) {
  return connection.execute(
    "UPDATE users SET username=?,email=?,profile=? WHERE id=?",
    values,
  );
}
export function updatePassword(values = [], connection = db) {
  return connection.execute(
    "UPDATE users SET password_hash=? WHERE id=?",
    values,
  );
}
export function findAll(values = [], connection = db) {
  return connection.execute(
    "SELECT * FROM users WHERE deleted_at IS NULL ORDER BY id DESC",
    values,
  );
}
export function createManaged(values = [], connection = db) {
  return connection.execute(
    "INSERT INTO users (username,email,password_hash,role,active,profile) VALUES (?,?,?,?,?,?)",
    values,
  );
}
export function findByIdForUpdate(values = [], connection = db) {
  return connection.execute(
    "SELECT * FROM users WHERE id=? AND deleted_at IS NULL FOR UPDATE",
    values,
  );
}
export function findActiveAdminsForUpdate(values = [], connection = db) {
  return connection.execute(
    "SELECT id FROM users WHERE role='admin' AND active=1 FOR UPDATE",
    values,
  );
}
export function updateManaged(values = [], connection = db) {
  return connection.execute(
    "UPDATE users SET username=?,email=?,role=?,active=?,profile=? WHERE id=?",
    values,
  );
}
export function archive(values = [], connection = db) {
  return connection.execute(
    "UPDATE users SET active=0,deleted_at=UTC_TIMESTAMP() WHERE id=?",
    values,
  );
}
