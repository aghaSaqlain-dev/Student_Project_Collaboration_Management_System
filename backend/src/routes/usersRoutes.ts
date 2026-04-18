import { Router } from "express";
import { createUser, deleteUser, listUsers, updateUser } from "../controllers/usersController.js";

const router = Router();

router.get("/users", listUsers);
router.post("/users", createUser);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

export default router;
