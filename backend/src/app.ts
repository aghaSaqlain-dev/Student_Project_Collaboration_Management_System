import cors from "cors";
import express from "express";
import { groups, tasks, users, withoutPassword } from "./data.js";

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

function getGroupById(groupId: number): Group | null {
    return groups.find((group) => group.id === groupId) ?? null;
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

app.get("/api/groups", (req, res) => {
    const search = String(req.query.search ?? "").trim().toLowerCase();

    const filtered = search
        ? groups.filter((group) => {
            return (
                group.name.toLowerCase().includes(search) ||
                group.description.toLowerCase().includes(search) ||
                group.tags.some((tag) => tag.toLowerCase().includes(search))
            );
        })
        : groups;

    return res.json({ groups: filtered });
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

export default app;