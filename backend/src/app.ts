import cors from "cors";
import express from "express";
import { groups, tasks, users, withoutPassword } from "./data.js";
import type { PublicUser, Role, User } from "./types.js";

const app = express();

app.use(cors());
app.use(express.json());

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

function generateAvatar(name: string): string {
    const initials = name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return initials || "US";
}

function nextUserId(): number {
    const maxId = users.reduce((max, user) => Math.max(max, user.id), 0);
    return maxId + 1;
}

function getAuthUser(req: express.Request): User | null {
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

function ensureAdmin(req: express.Request, res: express.Response): User | null {
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

app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.get("/api/bootstrap", (_req, res) => {
    res.json({
        users: users.map(withoutPassword),
        groups,
        tasks,
    });
});

app.post("/api/auth/login", (req, res) => {
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
});

app.post("/api/auth/register", (req, res) => {
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
});

app.get("/api/users", (req, res) => {
    const actor = ensureAdmin(req, res);
    if (!actor) {
        return;
    }

    const publicUsers: PublicUser[] = users.map(withoutPassword);
    return res.json({ users: publicUsers });
});

app.post("/api/users", (req, res) => {
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
});

app.patch("/api/users/:id", (req, res) => {
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
});

app.delete("/api/users/:id", (req, res) => {
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
});

export default app;
