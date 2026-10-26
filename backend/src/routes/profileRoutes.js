import { Router } from "express";
import * as profile from "../controller/profileController.js";
const router = Router();
router.get("/", profile.show);
router.put("/", profile.update);
router.put("/password", profile.changePassword);
export default router;
