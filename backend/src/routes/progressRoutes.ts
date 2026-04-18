import { Router } from "express";
import { addProgressFeedback, listGroupProgress, submitProgress } from "../controllers/progressController.js";

const router = Router();

router.post("/progress", submitProgress);
router.get("/groups/:id/progress", listGroupProgress);
router.patch("/progress/:id/feedback", addProgressFeedback);

export default router;
