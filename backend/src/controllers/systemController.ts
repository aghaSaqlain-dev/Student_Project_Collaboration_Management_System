import type { Request, Response } from "express";
import { groups, tasks, users, withoutPassword } from "../data.js";

export function health(_req: Request, res: Response): void {
    res.json({ status: "ok" });
}

export function bootstrap(_req: Request, res: Response): void {
    res.json({
        users: users.map(withoutPassword),
        groups,
        tasks,
    });
}
