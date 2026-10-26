import { db } from "../config/database.js";
export function ping(values = [], connection = db) {
  return connection.execute("SELECT 1", values);
}
