import type { Group } from "../types.js";
import { groups, tasks, users } from "../data.js";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

export function generateAvatar(name: string): string {
    const initials = name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return initials || "US";
}

export function nextUserId(): number {
    const maxId = users.reduce((max, user) => Math.max(max, user.id), 0);
    return maxId + 1;
}

export function nextTaskId(): number {
    const maxId = tasks.reduce((max, task) => Math.max(max, task.id), 0);
    return maxId + 1;
}

export function getGroupById(groupId: number): Group | null {
    return groups.find((group) => group.id === groupId) ?? null;
}
