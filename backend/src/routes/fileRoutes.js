import { Router } from "express";
import * as attachment from "../controller/attachmentController.js";
const router = Router();
router.get("/:id", attachment.download);
router.get("/:id/:content", (req, res, next) => {
  if (req.params.content !== "content") return res.sendStatus(404);
  return attachment.download(req, res, next);
});
router.delete("/:id", attachment.remove);
export default router;
