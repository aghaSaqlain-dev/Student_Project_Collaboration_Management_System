import type { Request, Response } from "express";
import { users, withoutPassword } from "../data.js";
import type { PublicUser, Role, User } from "../types.js";
import { ensureAdmin } from "../utils/auth.js";
import { EMAIL_REGEX, generateAvatar, nextUserId, normalizeEmail } from "../utils/dataAccess.js";

export function listUsers(req: Request, res: Response): Response | void {
    const actor = ensureAdmin(req, res);
    if (!actor) {
        return;
    }

    const publicUsers: PublicUser[] = users.map(withoutPassword);
    return res.json({ users: publicUsers });
}

export function createUser(req: Request, res: Response): Response | void {
    const actor = ensureAdmin(req, res);
    if (!actor) {
        return;
    }

    const { name, email, password, role } = req.body as {
        name?: string;
        email?: string;
        password?: string;
        role?: Role;
    };

    if (!name?.trim() || !email?.trim() || !password?.trim() || !role) {
        return res.status(400).json({ message: "Name, email, password, and role are required." });
    }

    if (!["student", "supervisor", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role." });
    }

    if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({ message: "Please provide a valid email address." });
    }

    if (password.trim().length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const normalizedEmail = normalizeEmail(email);
    const duplicate = users.find((u) => normalizeEmail(u.email) === normalizedEmail);
    if (duplicate) {
        return res.status(409).json({ message: "A user with this email already exists." });
    }

    const created: User = {
        id: nextUserId(),
        name: name.trim(),
        email: normalizedEmail,
        password: password.trim(),
        role,
        avatar: generateAvatar(name),
    };

    users.push(created);
    return res.status(201).json({ user: withoutPassword(created) });
}

export function updateUser(req: Request, res: Response): Response | void {
    const actor = ensureAdmin(req, res);
    if (!actor) {
        return;
    }

    const userId = Number(req.params.id);
    if (Number.isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user id." });
    }

    const index = users.findIndex((u) => u.id === userId);
    if (index < 0) {
        return res.status(404).json({ message: "User not found." });
    }

    const { name, email, role, password } = req.body as {
        name?: string;
        email?: string;
        role?: Role;
        password?: string;
    };

    if (role && !["student", "supervisor", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role." });
    }

    if (name !== undefined && !name.trim()) {
        return res.status(400).json({ message: "Name cannot be empty." });
    }

    if (email !== undefined) {
        if (!email.trim() || !EMAIL_REGEX.test(email)) {
            return res.status(400).json({ message: "Please provide a valid email address." });
        }

        const normalizedEmail = normalizeEmail(email);
        const duplicate = users.find((u) => normalizeEmail(u.email) === normalizedEmail && u.id !== userId);
        if (duplicate) {
            return res.status(409).json({ message: "A user with this email already exists." });
        }
    }

    if (password !== undefined && password.trim().length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const original = users[index];
    const updated: User = {
        ...original,
        ...(name !== undefined ? { name: name.trim(), avatar: generateAvatar(name) } : {}),
        ...(email !== undefined ? { email: normalizeEmail(email) } : {}),
        ...(role !== undefined ? { role } : {}),
        ...(password !== undefined ? { password: password.trim() } : {}),
    };

    if (original.id === actor.id && updated.role !== "admin") {
        return res.status(400).json({ message: "You cannot remove your own admin role." });
    }

    users[index] = updated;
    return res.json({ user: withoutPassword(updated) });
}

export function deleteUser(req: Request, res: Response): Response | void {
    const actor = ensureAdmin(req, res);
    if (!actor) {
        return;
    }

    const userId = Number(req.params.id);
    if (Number.isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user id." });
    }

    if (userId === actor.id) {
        return res.status(400).json({ message: "You cannot delete your own account." });
    }

    const index = users.findIndex((u) => u.id === userId);
    if (index < 0) {
        return res.status(404).json({ message: "User not found." });
    }

    users.splice(index, 1);
    return res.status(204).send();
}
