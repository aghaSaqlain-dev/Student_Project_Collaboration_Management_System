import { Router } from "express";
import { createTask, deleteTask, updateTask } from "../controllers/tasksController.js";

const router = Router();

router.post("/tasks", createTask);
router.patch("/tasks/:id", updateTask);
router.delete("/tasks/:id", deleteTask);

export default router;
