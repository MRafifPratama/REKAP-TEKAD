import { Router } from "express";
import * as attachment from "../controller/attachmentController.js";
const router = Router();
router.get("/:id", attachment.download);
router.delete("/:id", attachment.remove);
export default router;
