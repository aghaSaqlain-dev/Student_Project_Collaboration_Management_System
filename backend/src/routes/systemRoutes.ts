import { Router } from "express";
import { bootstrap, health } from "../controllers/systemController.js";

const router = Router();

router.get("/health", health);
router.get("/bootstrap", bootstrap);

export default router;
