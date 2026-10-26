import { db } from "../config/database.js";
export function findForUpdate(values = [], connection = db) {
  return connection.execute(
    "SELECT * FROM records WHERE id=? FOR UPDATE",
    values,
  );
}
export function create(values = [], connection = db) {
  return connection.execute(
    "INSERT INTO records (user_id,data) VALUES (?,?)",
    values,
  );
}
export function update(values = [], connection = db) {
  return connection.execute(
    "UPDATE records SET data=?,version=version+1 WHERE id=?",
    values,
  );
}
export function remove(values = [], connection = db) {
  return connection.execute("DELETE FROM records WHERE id=?", values);
}
export function findForUser(user, connection = db) {
  if (user.role !== "admin") return findPrimaryForUser(user.id, connection);
  return connection.execute(
    `SELECT r.*,u.profile AS owner FROM records r JOIN users u ON u.id=r.user_id ${user.role === "admin" ? "" : "WHERE r.user_id=?"} ORDER BY r.updated_at DESC`,
    user.role === "admin" ? [] : [user.id],
  );
}

// A user's permanent form is the oldest record; legacy extras remain visible to admins.
export function findPrimaryForUser(userId, connection = db, lock = false) {
  return connection.execute(
    `SELECT * FROM records WHERE user_id=? ORDER BY id ASC LIMIT 1 ${lock ? "FOR UPDATE" : ""}`,
    [userId],
  );
}
export function countForUser(userId, connection = db) {
  return connection.execute(
    "SELECT COUNT(*) AS total FROM records WHERE user_id=?",
    [userId],
  );
}
