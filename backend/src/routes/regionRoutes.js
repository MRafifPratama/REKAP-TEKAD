import { Router } from "express";
import * as region from "../controller/regionController.js";
const router = Router();
router.get("/", region.list);
export default router;
