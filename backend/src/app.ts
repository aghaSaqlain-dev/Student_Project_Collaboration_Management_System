import cors from "cors";
import express from "express";
import type { Evaluation, Group, ProgressReport, Task, User } from "./types.js";
import { groups, tasks, users, withoutPassword, systemSettings, progressReports, evaluations } from "./data.js";

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

app.post("/api/groups/:id/join-requests", (req, res) => {
    const actor = getAuthUser(req);
    if (!actor) {
        return res.status(401).json({ message: "Authentication required." });
    }

    if (actor.role !== "student") {
        return res.status(403).json({ message: "Only students can request to join groups." });
    }

    const groupId = Number(req.params.id);
    if (Number.isNaN(groupId)) {
        return res.status(400).json({ message: "Invalid group id." });
    }

    const group = getGroupById(groupId);
    if (!group) {
        return res.status(404).json({ message: "Group not found." });
    }

    if (group.status !== "open") {
        return res.status(400).json({ message: "This group is not accepting join requests." });
    }

    const alreadyMember = group.members.includes(actor.id) || group.leaderId === actor.id;
    if (alreadyMember) {
        return res.status(400).json({ message: "You are already a member of this group." });
    }

    if (group.pendingRequests.includes(actor.id)) {
        return res.status(400).json({ message: "You already have a pending request for this group." });
    }

    if (group.members.length >= group.maxSize) {
        return res.status(400).json({ message: "Group is full." });
    }

    group.pendingRequests.push(actor.id);
    return res.json({ group });
});

app.post("/api/groups/:id/requests/:userId/approve", (req, res) => {
    const actor = getAuthUser(req);
    if (!actor) {
        return res.status(401).json({ message: "Authentication required." });
    }

    const groupId = Number(req.params.id);
    const requestedUserId = Number(req.params.userId);

    if (Number.isNaN(groupId) || Number.isNaN(requestedUserId)) {
        return res.status(400).json({ message: "Invalid id provided." });
    }

    const group = getGroupById(groupId);
    if (!group) {
        return res.status(404).json({ message: "Group not found." });
    }

    if (group.leaderId !== actor.id) {
        return res.status(403).json({ message: "Only the team leader can approve join requests." });
    }

    if (!group.pendingRequests.includes(requestedUserId)) {
        return res.status(404).json({ message: "Join request not found." });
    }

    if (group.members.length >= group.maxSize) {
        return res.status(400).json({ message: "Group is full." });
    }

    group.pendingRequests = group.pendingRequests.filter((id) => id !== requestedUserId);
    if (!group.members.includes(requestedUserId)) {
        group.members.push(requestedUserId);
    }

    if (group.status === "open") {
        group.status = "formed";
    }

    return res.json({ group });
});

app.post("/api/groups/:id/requests/:userId/reject", (req, res) => {
    const actor = getAuthUser(req);
    if (!actor) {
        return res.status(401).json({ message: "Authentication required." });
    }

    const groupId = Number(req.params.id);
    const requestedUserId = Number(req.params.userId);

    if (Number.isNaN(groupId) || Number.isNaN(requestedUserId)) {
        return res.status(400).json({ message: "Invalid id provided." });
    }

    const group = getGroupById(groupId);
    if (!group) {
        return res.status(404).json({ message: "Group not found." });
    }

    if (group.leaderId !== actor.id) {
        return res.status(403).json({ message: "Only the team leader can reject join requests." });
    }

    if (!group.pendingRequests.includes(requestedUserId)) {
        return res.status(404).json({ message: "Join request not found." });
    }

    group.pendingRequests = group.pendingRequests.filter((id) => id !== requestedUserId);
    return res.json({ group });
});

app.post("/api/groups/:id/approve", (req, res) => {
    const actor = getAuthUser(req);
    if (!actor) {
        return res.status(401).json({ message: "Authentication required." });
    }

    if (actor.role !== "supervisor") {
        return res.status(403).json({ message: "Only supervisors can approve teams." });
    }

    const groupId = Number(req.params.id);
    if (Number.isNaN(groupId)) {
        return res.status(400).json({ message: "Invalid group id." });
    }

    const group = getGroupById(groupId);
    if (!group) {
        return res.status(404).json({ message: "Group not found." });
    }

    if (group.status !== "formed") {
        return res.status(400).json({ message: "Only formed groups can be supervisor-approved." });
    }

    group.status = "active";
    if (!group.supervisorId) {
        group.supervisorId = actor.id;
    }

    return res.json({ group });
});

// FR-3: supervisor or team leader marks an active group as completed
app.post("/api/groups/:id/complete", (req, res) => {
    const actor = getAuthUser(req);
    if (!actor) {
        return res.status(401).json({ message: "Authentication required." });
    }

    const groupId = Number(req.params.id);
    if (Number.isNaN(groupId)) {
        return res.status(400).json({ message: "Invalid group id." });
    }

    const group = getGroupById(groupId);
    if (!group) {
        return res.status(404).json({ message: "Group not found." });
    }

    const isSupervisor = actor.role === "supervisor";
    const isLeader = group.leaderId === actor.id;

    if (!isSupervisor && !isLeader) {
        return res.status(403).json({ message: "Only the supervisor or team leader can mark a group as completed." });
    }

    if (group.status !== "active") {
        return res.status(400).json({ message: "Only active groups can be marked as completed." });
    }

    group.status = "completed";
    return res.json({ group });
});

// FR-3: task creation enforces group must be active
function nextTaskId(): number {
    const maxId = tasks.reduce((max, task) => Math.max(max, task.id), 0);
    return maxId + 1;
}

app.post("/api/tasks", (req, res) => {
    const actor = getAuthUser(req);
    if (!actor) {
        return res.status(401).json({ message: "Authentication required." });
    }

    const { title, description, groupId, assigneeId, priority, dueDate } = req.body as {
        title?: string;
        description?: string;
        groupId?: number;
        assigneeId?: number;
        priority?: string;
        dueDate?: string;
    };

    if (!title?.trim() || !groupId) {
        return res.status(400).json({ message: "Title and groupId are required." });
    }

    const group = getGroupById(Number(groupId));
    if (!group) {
        return res.status(404).json({ message: "Group not found." });
    }

    // FR-3: no task creation before supervisor approval
    if (group.status !== "active") {
        return res.status(400).json({ message: "Tasks can only be created for active groups." });
    }

    const isSupervisor = actor.role === "supervisor";
    const isLeader = group.leaderId === actor.id;
    const isMember = group.members.includes(actor.id);

    if (!isSupervisor && !isLeader && !isMember) {
        return res.status(403).json({ message: "You are not a member of this group." });
    }

    if (!isSupervisor && !isLeader) {
        return res.status(403).json({ message: "Only the team leader can create tasks." });
    }

    const validPriorities = ["low", "medium", "high"];
    const resolvedPriority = validPriorities.includes(priority ?? "") ? (priority as "low" | "medium" | "high") : "medium";

    const created = {
        id: nextTaskId(),
        groupId: Number(groupId),
        title: title.trim(),
        description: description?.trim() ?? "",
        assigneeId: assigneeId ? Number(assigneeId) : actor.id,
        status: "todo" as const,
        priority: resolvedPriority,
        createdBy: actor.id,
        dueDate: dueDate ?? "",
    };

    tasks.push(created);
    return res.status(201).json({ task: created });
});

app.patch("/api/tasks/:id", (req, res) => {
    const actor = getAuthUser(req);
    if (!actor) {
        return res.status(401).json({ message: "Authentication required." });
    }

    const taskId = Number(req.params.id);
    if (Number.isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task id." });
    }

    const index = tasks.findIndex((t) => t.id === taskId);
    if (index < 0) {
        return res.status(404).json({ message: "Task not found." });
    }

    const task = tasks[index];
    const group = getGroupById(task.groupId);
    if (!group) {
        return res.status(404).json({ message: "Associated group no longer exists." });
    }

    // FR-3: no task updates once group is completed
    if (group.status === "completed") {
        return res.status(400).json({ message: "Tasks in completed groups cannot be modified." });
    }

    const isSupervisor = actor.role === "supervisor";
    const isLeader = group.leaderId === actor.id;
    const isAssignee = task.assigneeId === actor.id;

    if (!isSupervisor && !isLeader && !isAssignee) {
        return res.status(403).json({ message: "You do not have permission to update this task." });
    }

    const { title, description, status, priority, dueDate, assigneeId } = req.body as {
        title?: string;
        description?: string;
        status?: string;
        priority?: string;
        dueDate?: string;
        assigneeId?: number;
    };

    const validStatuses = ["todo", "in-progress", "done"];
    const validPriorities = ["low", "medium", "high"];

    if (status !== undefined && !validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status." });
    }
    if (priority !== undefined && !validPriorities.includes(priority)) {
        return res.status(400).json({ message: "Invalid priority." });
    }

    // Only leader/supervisor can change title, description, assignee, priority, dueDate
    const canFullEdit = isSupervisor || isLeader;

    tasks[index] = {
        ...task,
        ...(canFullEdit && title !== undefined ? { title: title.trim() } : {}),
        ...(canFullEdit && description !== undefined ? { description: description.trim() } : {}),
        ...(canFullEdit && assigneeId !== undefined ? { assigneeId: Number(assigneeId) } : {}),
        ...(canFullEdit && priority !== undefined ? { priority: priority as "low" | "medium" | "high" } : {}),
        ...(canFullEdit && dueDate !== undefined ? { dueDate } : {}),
        ...(status !== undefined ? { status: status as "todo" | "in-progress" | "done" } : {}),
    };

    return res.json({ task: tasks[index] });
});

app.delete("/api/tasks/:id", (req, res) => {
    const actor = getAuthUser(req);
    if (!actor) {
        return res.status(401).json({ message: "Authentication required." });
    }

    const taskId = Number(req.params.id);
    if (Number.isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task id." });
    }

    const index = tasks.findIndex((t) => t.id === taskId);
    if (index < 0) {
        return res.status(404).json({ message: "Task not found." });
    }

    const task = tasks[index];
    const group = getGroupById(task.groupId);

    const isSupervisor = actor.role === "supervisor";
    const isLeader = group?.leaderId === actor.id;

    if (!isSupervisor && !isLeader) {
        return res.status(403).json({ message: "Only the team leader or supervisor can delete tasks." });
    }

    tasks.splice(index, 1);
    return res.status(204).send();
});

// ─── FR-6: Progress Submission ───────────────────────────────────────────────

app.post("/api/progress", (req, res) => {
    const { groupId, submittedBy, title, content, type } = req.body as Partial<ProgressReport>;
    if (!groupId || !submittedBy || !title || !content || !type) return res.status(400).json({ message: "All fields required." });
    const group = groups.find((g) => g.id === groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });
    if (!group.members.includes(submittedBy) && group.leaderId !== submittedBy) return res.status(403).json({ message: "You are not a member of this group." });
    const report: ProgressReport = {
        id: progressReports.length + 1, groupId, submittedBy, title, content,
        type, submittedAt: new Date().toISOString(),
    };
    progressReports.push(report);
    return res.status(201).json({ message: "Progress report submitted.", report });
});

app.get("/api/groups/:id/progress", (req, res) => {
    const groupId = Number(req.params.id);
    const group = groups.find((g) => g.id === groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });
    return res.json(progressReports.filter((r) => r.groupId === groupId));
});

app.patch("/api/progress/:id/feedback", (req, res) => {
    const { feedback, supervisorId } = req.body as { feedback?: string; supervisorId?: number };
    if (!feedback || !supervisorId) return res.status(400).json({ message: "Feedback and supervisorId required." });
    const supervisor = users.find((u) => u.id === supervisorId);
    if (!supervisor || supervisor.role !== "supervisor") return res.status(403).json({ message: "Only supervisors can give feedback." });
    const report = progressReports.find((r) => r.id === Number(req.params.id));
    if (!report) return res.status(404).json({ message: "Report not found." });
    report.supervisorFeedback = feedback;
    report.reviewedBy = supervisorId;
    return res.json({ message: "Feedback added.", report });
});

// ─── FR-7: Evaluation & Feedback ─────────────────────────────────────────────

app.post("/api/evaluations", (req, res) => {
    const { groupId, supervisorId, score, feedback } = req.body as Partial<Evaluation>;
    if (!groupId || !supervisorId || score === undefined || !feedback) return res.status(400).json({ message: "All fields required." });
    const supervisor = users.find((u) => u.id === supervisorId);
    if (!supervisor || supervisor.role !== "supervisor") return res.status(403).json({ message: "Only supervisors can evaluate." });
    const group = groups.find((g) => g.id === groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });
    if (score < 0 || score > 100) return res.status(400).json({ message: "Score must be between 0 and 100." });
    const evaluation: Evaluation = {
        id: evaluations.length + 1, groupId, supervisorId, score, feedback,
        evaluatedAt: new Date().toISOString(),
    };
    evaluations.push(evaluation);
    return res.status(201).json({ message: "Evaluation submitted.", evaluation });
});

app.get("/api/groups/:id/evaluation", (req, res) => {
    const groupId = Number(req.params.id);
    const group = groups.find((g) => g.id === groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });
    const evaluation = evaluations.find((e) => e.groupId === groupId);
    if (!evaluation) return res.status(404).json({ message: "No evaluation yet." });
    return res.json(evaluation);
});

// ─── FR-8: Admin Controls ─────────────────────────────────────────────────────

app.get("/api/admin/settings", (req, res) => {
    return res.json(systemSettings);
});

app.patch("/api/admin/settings", (req, res) => {
    const { userId } = req.body as { userId?: number };
    const admin = users.find((u) => u.id === userId);
    if (!admin || admin.role !== "admin") return res.status(403).json({ message: "Only admins can change settings." });
    const { maxTeamSize, submissionDeadline, registrationDeadline } = req.body;
    if (maxTeamSize !== undefined) systemSettings.maxTeamSize = maxTeamSize;
    if (submissionDeadline !== undefined) systemSettings.submissionDeadline = submissionDeadline;
    if (registrationDeadline !== undefined) systemSettings.registrationDeadline = registrationDeadline;
    return res.json({ message: "Settings updated.", settings: systemSettings });
});

app.get("/api/admin/logs", (req, res) => {
    const { userId } = req.query as { userId?: string };
    const admin = users.find((u) => u.id === Number(userId));
    if (!admin || admin.role !== "admin") return res.status(403).json({ message: "Only admins can view logs." });
    return res.json({
        totalUsers: users.length,
        totalGroups: groups.length,
        totalTasks: tasks.length,
        totalReports: progressReports.length,
        totalEvaluations: evaluations.length,
        systemSettings,
    });
});

export default app;