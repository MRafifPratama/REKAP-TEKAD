import { Router } from "express";
import * as health from "../controller/healthController.js";
const router = Router();
router.get("/", health.status);
export default router;
