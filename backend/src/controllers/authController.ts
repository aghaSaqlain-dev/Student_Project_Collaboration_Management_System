import type { Request, Response } from "express";
import { users, withoutPassword } from "../data.js";
import type { User } from "../types.js";
import { EMAIL_REGEX, generateAvatar, nextUserId, normalizeEmail } from "../utils/dataAccess.js";

export function login(req: Request, res: Response): Response {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = users.find((u) => normalizeEmail(u.email) === normalizedEmail && u.password === password);

    if (!user) {
        return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.json({ user: withoutPassword(user) });
}

export function register(req: Request, res: Response): Response {
    const { name, email, password } = req.body as { name?: string; email?: string; password?: string };

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
        return res.status(400).json({ message: "Name, email, and password are required." });
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
        return res.status(409).json({ message: "An account with this email already exists." });
    }

    const created: User = {
        id: nextUserId(),
        name: name.trim(),
        email: normalizedEmail,
        password: password.trim(),
        role: "student",
        avatar: generateAvatar(name),
    };

    users.push(created);
    return res.status(201).json({ user: withoutPassword(created) });
}
