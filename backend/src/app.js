import "./config/env.js";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import { checkOrigin } from "./middleware/origin.js";
import { apiLimit } from "./middleware/rateLimit.js";
import { errorHandler } from "./middleware/errorHandler.js";
export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use("/api", apiLimit, checkOrigin, routes);
app.use((req, res) =>
  res.status(404).json({ message: "Endpoint tidak ditemukan" }),
);
app.use(errorHandler);
