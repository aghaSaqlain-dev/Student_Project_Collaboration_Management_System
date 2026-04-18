import { Router } from "express";
import { getLogs, getSettings, updateSettings } from "../controllers/adminController.js";

const router = Router();

router.get("/admin/settings", getSettings);
router.patch("/admin/settings", updateSettings);
router.get("/admin/logs", getLogs);

export default router;
