import { Router } from "express";
import {
    approveWorkLog,
    blockWorkLogModification,
    listGroupWorkLogs,
    submitWorkLog,
} from "../controllers/workLogsController.js";

const router = Router();

router.post("/work-logs", submitWorkLog);
router.get("/groups/:id/work-logs", listGroupWorkLogs);
router.post("/work-logs/:id/approve", approveWorkLog);
router.patch("/work-logs/:id", blockWorkLogModification);

export default router;
