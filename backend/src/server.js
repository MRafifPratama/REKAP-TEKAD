import "./config/env.js";
import { app } from "./app.js";
import { db } from "./config/database.js";
const port = Number(process.env.PORT || 3000);
const host =
  process.env.HOST ||
  (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");
const server = app.listen(port, host, () =>
  console.log("API TEKAD: http://127.0.0.1:" + port),
);
server.on("error", (error) => {
  console.error("API tidak dapat dijalankan:", error.message);
  process.exitCode = 1;
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    server.close(async () => {
      await db.end();
      process.exit(0);
    });
  });
