import { db } from "../config/database.js";
export function findForUser(user, connection = db) {
  return connection.execute(
    `SELECT l.*,u.username FROM activity_logs l JOIN users u ON u.id=l.user_id ${user.role === "admin" ? "" : "WHERE l.user_id=?"} ORDER BY l.id DESC LIMIT 500`,
    user.role === "admin" ? [] : [user.id],
  );
}
export function create(values, connection = db) {
  return connection.execute(
    "INSERT INTO activity_logs (user_id,action,entity,entity_id,changes) VALUES (?,?,?,?,?)",
    values,
  );
}
