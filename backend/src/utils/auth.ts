import type { Request, Response } from "express";
import { users } from "../data.js";
import type { User } from "../types.js";

export function getAuthUser(req: Request): User | null {
    const idHeader = req.header("x-user-id");
    if (!idHeader) {
        return null;
    }

    const id = Number(idHeader);
    if (Number.isNaN(id)) {
        return null;
    }

    return users.find((candidate) => candidate.id === id) ?? null;
}

export function ensureAdmin(req: Request, res: Response): User | null {
    const actor = getAuthUser(req);
    if (!actor) {
        res.status(401).json({ message: "Authentication required." });
        return null;
    }

    if (actor.role !== "admin") {
        res.status(403).json({ message: "Admin access required." });
        return null;
    }

    return actor;
}
