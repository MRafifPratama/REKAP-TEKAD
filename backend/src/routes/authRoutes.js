import { Router } from "express";
import * as auth from "../controller/authController.js";
import { authLimit } from "../middleware/rateLimit.js";
const router = Router();
router.post("/register", authLimit, auth.register);
router.post("/login", authLimit, auth.login);
router.post("/logout", auth.logout);
export default router;
