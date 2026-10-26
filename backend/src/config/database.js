import "./env.js";
import { jsonTypeCast } from "../utils/json.js";
import mysql from "mysql2/promise";
export const db = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  ...(process.env.DB_SOCKET ? { socketPath: process.env.DB_SOCKET } : {}),
  connectTimeout: 10000,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "rekap_tekad",
  connectionLimit: 10,
  charset: "utf8mb4",
  typeCast: jsonTypeCast,
  decimalNumbers: true,
  timezone: "Z",
});
// Keep TIMESTAMP reads and application-side Date serialization in UTC.
db.on("connection", (connection) => {
  connection.query("SET time_zone = '+00:00'", (error) => {
    if (error) connection.destroy();
  });
});
