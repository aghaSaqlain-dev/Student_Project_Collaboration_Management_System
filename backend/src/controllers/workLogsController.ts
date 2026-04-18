import type { Request, Response } from "express";
import { workLogs } from "../data.js";
import type { WorkLog } from "../types.js";
import { getAuthUser } from "../utils/auth.js";
import { getGroupById } from "../utils/dataAccess.js";
import { appendWorkLogEvent } from "../utils/workLogStore.js";

function nextWorkLogId(): number {
    const maxId = workLogs.reduce((max, item) => Math.max(max, item.id), 0);
    return maxId + 1;
}

function getPeerIds(groupId: number, submittedBy: number): Set<number> {
    const group = getGroupById(groupId);
    if (!group) {
        return new Set<number>();
    }

    const peerIds = new Set<number>([...group.members, group.leaderId]);
    peerIds.delete(submittedBy);
    return peerIds;
}

export async function submitWorkLog(req: Request, res: Response): Promise<Response> {
    const actor = getAuthUser(req);
    if (!actor) {
        return res.status(401).json({ message: "Authentication required." });
    }

    const { groupId, title, details, hours, date } = req.body as {
        groupId?: number;
        title?: string;
        details?: string;
        hours?: number;
        date?: string;
    };

    if (!groupId || !title?.trim() || !details?.trim() || hours === undefined || !date?.trim()) {
        return res.status(400).json({ message: "groupId, title, details, hours, and date are required." });
    }

    if (hours <= 0) {
        return res.status(400).json({ message: "Hours must be greater than 0." });
    }

    const group = getGroupById(groupId);
    if (!group) {
        return res.status(404).json({ message: "Group not found." });
    }

    const members = new Set<number>([...group.members, group.leaderId]);
    if (!members.has(actor.id)) {
        return res.status(403).json({ message: "Only group members can submit work logs." });
    }

    const created: WorkLog = {
        id: nextWorkLogId(),
        groupId,
        submittedBy: actor.id,
        title: title.trim(),
        details: details.trim(),
        hours,
        date: date.trim(),
        submittedAt: new Date().toISOString(),
        approvedBy: [],
        status: "pending",
    };

    workLogs.push(created);
    await appendWorkLogEvent("SUBMITTED", created, actor.id);

    return res.status(201).json({ message: "Work log submitted.", workLog: created });
}

export function listGroupWorkLogs(req: Request, res: Response): Response {
    const groupId = Number(req.params.id);
    if (Number.isNaN(groupId)) {
        return res.status(400).json({ message: "Invalid group id." });
    }

    const group = getGroupById(groupId);
    if (!group) {
        return res.status(404).json({ message: "Group not found." });
    }

    const onlyVerified = String(req.query.verified ?? "false").toLowerCase() === "true";
    const filtered = workLogs.filter((log) => log.groupId === groupId && (!onlyVerified || log.status === "verified"));

    return res.json({ workLogs: filtered });
}

export async function approveWorkLog(req: Request, res: Response): Promise<Response> {
    const actor = getAuthUser(req);
    if (!actor) {
        return res.status(401).json({ message: "Authentication required." });
    }

    const workLogId = Number(req.params.id);
    if (Number.isNaN(workLogId)) {
        return res.status(400).json({ message: "Invalid work log id." });
    }

    const workLog = workLogs.find((item) => item.id === workLogId);
    if (!workLog) {
        return res.status(404).json({ message: "Work log not found." });
    }

    if (workLog.status === "verified") {
        return res.status(400).json({ message: "Verified work logs cannot be modified." });
    }

    if (actor.id === workLog.submittedBy) {
        return res.status(403).json({ message: "Submitter cannot approve their own log." });
    }

    const peerIds = getPeerIds(workLog.groupId, workLog.submittedBy);
    if (!peerIds.size) {
        return res.status(400).json({ message: "No peers are available to verify this work log." });
    }

    if (!peerIds.has(actor.id)) {
        return res.status(403).json({ message: "Only peers from the same group can approve this log." });
    }

    if (workLog.approvedBy.includes(actor.id)) {
        return res.status(400).json({ message: "You have already approved this log." });
    }

    workLog.approvedBy.push(actor.id);
    await appendWorkLogEvent("PEER_APPROVED", workLog, actor.id);

    if (workLog.approvedBy.length >= 1) {
        workLog.status = "verified";
        workLog.verifiedAt = new Date().toISOString();
        await appendWorkLogEvent("VERIFIED", workLog, actor.id);
    }

    return res.json({ message: "Work log approval recorded.", workLog });
}

export function blockWorkLogModification(req: Request, res: Response): Response {
    const workLogId = Number(req.params.id);
    if (Number.isNaN(workLogId)) {
        return res.status(400).json({ message: "Invalid work log id." });
    }

    const workLog = workLogs.find((item) => item.id === workLogId);
    if (!workLog) {
        return res.status(404).json({ message: "Work log not found." });
    }

    return res.status(403).json({ message: "Work logs are immutable and cannot be modified." });
}
