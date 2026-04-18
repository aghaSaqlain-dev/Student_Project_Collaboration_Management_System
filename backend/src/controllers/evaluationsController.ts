import type { Request, Response } from "express";
import { evaluations, groups, users } from "../data.js";
import type { Evaluation } from "../types.js";

export function createEvaluation(req: Request, res: Response): Response {
    const { groupId, supervisorId, score, feedback } = req.body as Partial<Evaluation>;
    if (!groupId || !supervisorId || score === undefined || !feedback) {
        return res.status(400).json({ message: "All fields required." });
    }

    const supervisor = users.find((u) => u.id === supervisorId);
    if (!supervisor || supervisor.role !== "supervisor") {
        return res.status(403).json({ message: "Only supervisors can evaluate." });
    }

    const group = groups.find((g) => g.id === groupId);
    if (!group) {
        return res.status(404).json({ message: "Group not found." });
    }

    if (score < 0 || score > 100) {
        return res.status(400).json({ message: "Score must be between 0 and 100." });
    }

    const evaluation: Evaluation = {
        id: evaluations.length + 1,
        groupId,
        supervisorId,
        score,
        feedback,
        evaluatedAt: new Date().toISOString(),
    };

    evaluations.push(evaluation);
    return res.status(201).json({ message: "Evaluation submitted.", evaluation });
}

export function getGroupEvaluation(req: Request, res: Response): Response {
    const groupId = Number(req.params.id);
    const group = groups.find((g) => g.id === groupId);
    if (!group) {
        return res.status(404).json({ message: "Group not found." });
    }

    const evaluation = evaluations.find((e) => e.groupId === groupId);
    if (!evaluation) {
        return res.status(404).json({ message: "No evaluation yet." });
    }

    return res.json(evaluation);
}
