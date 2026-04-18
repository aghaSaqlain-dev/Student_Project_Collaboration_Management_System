import cors from "cors";
import express from "express";
import { groups, tasks, users, withoutPassword } from "./data.js";
import type { Task } from "./types.js";

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

    const user = users.find((u) => u.email === email && u.password === password);

    if (!user) {
        return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.json({ user: withoutPassword(user) });
});

// ─── FR-4: Task Management ───────────────────────────────────────────────────

// Create task (leader only, group must be active)
app.post("/api/tasks", (req, res) => {
    const { groupId, title, description, assigneeId, priority, dueDate, createdBy } =
        req.body as Partial<Task> & { createdBy: number };

    const group = groups.find((g) => g.id === groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    if (group.status !== "active") {
        return res.status(400).json({ message: "Tasks can only be created when group is active." });
    }

    if (group.leaderId !== createdBy) {
        return res.status(403).json({ message: "Only the team leader can create tasks." });
    }

    if (!group.members.includes(assigneeId!)) {
        return res.status(400).json({ message: "Assignee must be a group member." });
    }

    const newTask: Task = {
        id: tasks.length + 1,
        groupId: groupId!,
        title: title!,
        description: description ?? "",
        assigneeId: assigneeId!,
        status: "todo",
        priority: priority ?? "medium",
        createdBy,
        dueDate: dueDate ?? "",
    };

    tasks.push(newTask);
    return res.status(201).json({ message: "Task created.", task: newTask });
});

// Get all tasks for a group
app.get("/api/groups/:id/tasks", (req, res) => {
    const groupId = Number(req.params.id);
    const group = groups.find((g) => g.id === groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    const groupTasks = tasks.filter((t) => t.groupId === groupId);
    return res.json(groupTasks);
});

// Update task status (assignee or leader)
app.patch("/api/tasks/:id/status", (req, res) => {
    const taskId = Number(req.params.id);
    const { status, userId } = req.body as { status?: string; userId?: number };

    const validStatuses = ["todo", "in-progress", "done"];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status." });
    }

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return res.status(404).json({ message: "Task not found." });

    const group = groups.find((g) => g.id === task.groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    if (task.assigneeId !== userId && group.leaderId !== userId) {
        return res.status(403).json({ message: "Only assignee or leader can update task status." });
    }

    task.status = status as Task["status"];
    return res.json({ message: "Task status updated.", task });
});

// Reassign task (leader only)
app.patch("/api/tasks/:id/assign", (req, res) => {
    const taskId = Number(req.params.id);
    const { assigneeId, userId } = req.body as { assigneeId?: number; userId?: number };

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return res.status(404).json({ message: "Task not found." });

    const group = groups.find((g) => g.id === task.groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    if (group.leaderId !== userId) {
        return res.status(403).json({ message: "Only the leader can reassign tasks." });
    }

    if (!group.members.includes(assigneeId!)) {
        return res.status(400).json({ message: "Assignee must be a group member." });
    }

    task.assigneeId = assigneeId!;
    return res.json({ message: "Task reassigned.", task });
});

export default app;