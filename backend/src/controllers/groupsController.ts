import type { Request, Response } from "express";
import { groups } from "../data.js";
import { getAuthUser } from "../utils/auth.js";
import { getGroupById } from "../utils/dataAccess.js";

export function listGroups(req: Request, res: Response): Response {
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
}

export function requestJoinGroup(req: Request, res: Response): Response {
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
}

export function approveJoinRequest(req: Request, res: Response): Response {
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
}

export function rejectJoinRequest(req: Request, res: Response): Response {
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
}

export function approveGroup(req: Request, res: Response): Response {
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
}

export function completeGroup(req: Request, res: Response): Response {
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
}
