import cors from "cors";
import express from "express";
import { evaluations, groups, progressReports, systemSettings, tasks, users, withoutPassword } from "./data.js";
import type { Evaluation, ProgressReport, Task } from "./types.js";

const app = express();

app.use(cors());
app.use(express.json());

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
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ message: "Invalid email or password." });
    return res.json({ user: withoutPassword(user) });
});

// ─── FR-4: Task Management ───────────────────────────────────────────────────

app.post("/api/tasks", (req, res) => {
    const { groupId, title, description, assigneeId, priority, dueDate, createdBy } =
        req.body as Partial<Task> & { createdBy: number };
    const group = groups.find((g) => g.id === groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });
    if (group.status !== "active") return res.status(400).json({ message: "Tasks can only be created when group is active." });
    if (group.leaderId !== createdBy) return res.status(403).json({ message: "Only the team leader can create tasks." });
    if (!group.members.includes(assigneeId!)) return res.status(400).json({ message: "Assignee must be a group member." });
    const newTask: Task = {
        id: tasks.length + 1, groupId: groupId!, title: title!, description: description ?? "",
        assigneeId: assigneeId!, status: "todo", priority: priority ?? "medium", createdBy, dueDate: dueDate ?? "",
    };
    tasks.push(newTask);
    return res.status(201).json({ message: "Task created.", task: newTask });
});

app.get("/api/groups/:id/tasks", (req, res) => {
    const groupId = Number(req.params.id);
    const group = groups.find((g) => g.id === groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });
    return res.json(tasks.filter((t) => t.groupId === groupId));
});

app.patch("/api/tasks/:id/status", (req, res) => {
    const taskId = Number(req.params.id);
    const { status, userId } = req.body as { status?: string; userId?: number };
    const validStatuses = ["todo", "in-progress", "done"];
    if (!status || !validStatuses.includes(status)) return res.status(400).json({ message: "Invalid status." });
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return res.status(404).json({ message: "Task not found." });
    const group = groups.find((g) => g.id === task.groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });
    if (task.assigneeId !== userId && group.leaderId !== userId) return res.status(403).json({ message: "Only assignee or leader can update task status." });
    task.status = status as Task["status"];
    return res.json({ message: "Task status updated.", task });
});

app.patch("/api/tasks/:id/assign", (req, res) => {
    const taskId = Number(req.params.id);
    const { assigneeId, userId } = req.body as { assigneeId?: number; userId?: number };
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return res.status(404).json({ message: "Task not found." });
    const group = groups.find((g) => g.id === task.groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });
    if (group.leaderId !== userId) return res.status(403).json({ message: "Only the leader can reassign tasks." });
    if (!group.members.includes(assigneeId!)) return res.status(400).json({ message: "Assignee must be a group member." });
    task.assigneeId = assigneeId!;
    return res.json({ message: "Task reassigned.", task });
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