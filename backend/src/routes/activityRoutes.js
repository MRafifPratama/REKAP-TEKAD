import { Router } from "express";
import * as activity from "../controller/activityController.js";
const router = Router();
router.get("/", activity.list);
export default router;
