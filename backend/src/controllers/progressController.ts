import type { Request, Response } from "express";
import { groups, progressReports, users } from "../data.js";
import type { ProgressReport } from "../types.js";

export function submitProgress(req: Request, res: Response): Response {
    const { groupId, submittedBy, title, content, type } = req.body as Partial<ProgressReport>;
    if (!groupId || !submittedBy || !title || !content || !type) {
        return res.status(400).json({ message: "All fields required." });
    }

    const group = groups.find((g) => g.id === groupId);
    if (!group) {
        return res.status(404).json({ message: "Group not found." });
    }

    if (!group.members.includes(submittedBy) && group.leaderId !== submittedBy) {
        return res.status(403).json({ message: "You are not a member of this group." });
    }

    const report: ProgressReport = {
        id: progressReports.length + 1,
        groupId,
        submittedBy,
        title,
        content,
        type,
        submittedAt: new Date().toISOString(),
    };

    progressReports.push(report);
    return res.status(201).json({ message: "Progress report submitted.", report });
}

export function listGroupProgress(req: Request, res: Response): Response {
    const groupId = Number(req.params.id);
    const group = groups.find((g) => g.id === groupId);
    if (!group) {
        return res.status(404).json({ message: "Group not found." });
    }

    return res.json(progressReports.filter((r) => r.groupId === groupId));
}

export function addProgressFeedback(req: Request, res: Response): Response {
    const { feedback, supervisorId } = req.body as { feedback?: string; supervisorId?: number };
    if (!feedback || !supervisorId) {
        return res.status(400).json({ message: "Feedback and supervisorId required." });
    }

    const supervisor = users.find((u) => u.id === supervisorId);
    if (!supervisor || supervisor.role !== "supervisor") {
        return res.status(403).json({ message: "Only supervisors can give feedback." });
    }

    const report = progressReports.find((r) => r.id === Number(req.params.id));
    if (!report) {
        return res.status(404).json({ message: "Report not found." });
    }

    report.supervisorFeedback = feedback;
    report.reviewedBy = supervisorId;
    return res.json({ message: "Feedback added.", report });
}
