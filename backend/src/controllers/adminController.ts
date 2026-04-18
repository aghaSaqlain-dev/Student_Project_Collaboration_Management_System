import type { Request, Response } from "express";
import { evaluations, groups, progressReports, systemSettings, tasks, users } from "../data.js";

export function getSettings(_req: Request, res: Response): Response {
    return res.json(systemSettings);
}

export function updateSettings(req: Request, res: Response): Response {
    const { userId } = req.body as { userId?: number };
    const admin = users.find((u) => u.id === userId);
    if (!admin || admin.role !== "admin") {
        return res.status(403).json({ message: "Only admins can change settings." });
    }

    const { maxTeamSize, submissionDeadline, registrationDeadline } = req.body as {
        maxTeamSize?: number;
        submissionDeadline?: string;
        registrationDeadline?: string;
    };

    if (maxTeamSize !== undefined) {
        systemSettings.maxTeamSize = maxTeamSize;
    }
    if (submissionDeadline !== undefined) {
        systemSettings.submissionDeadline = submissionDeadline;
    }
    if (registrationDeadline !== undefined) {
        systemSettings.registrationDeadline = registrationDeadline;
    }

    return res.json({ message: "Settings updated.", settings: systemSettings });
}

export function getLogs(req: Request, res: Response): Response {
    const { userId } = req.query as { userId?: string };
    const admin = users.find((u) => u.id === Number(userId));
    if (!admin || admin.role !== "admin") {
        return res.status(403).json({ message: "Only admins can view logs." });
    }

    return res.json({
        totalUsers: users.length,
        totalGroups: groups.length,
        totalTasks: tasks.length,
        totalReports: progressReports.length,
        totalEvaluations: evaluations.length,
        systemSettings,
    });
}
