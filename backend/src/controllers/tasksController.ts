import type { Request, Response } from "express";
import { tasks } from "../data.js";
import { getAuthUser } from "../utils/auth.js";
import { getGroupById, nextTaskId } from "../utils/dataAccess.js";

export function createTask(req: Request, res: Response): Response {
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
}

export function updateTask(req: Request, res: Response): Response {
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
}

export function deleteTask(req: Request, res: Response): Response {
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
}
