import { Router } from "express";
import { createEvaluation, getGroupEvaluation } from "../controllers/evaluationsController.js";

const router = Router();

router.post("/evaluations", createEvaluation);
router.get("/groups/:id/evaluation", getGroupEvaluation);

export default router;
