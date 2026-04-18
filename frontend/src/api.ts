import type { BootstrapResponse, Group, Task, User } from "./types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });

    if (!response.ok) {
        let message = "Request failed";
        try {
            const body = await response.json();
            if (typeof body?.message === "string") {
                message = body.message;
            }
        } catch {
            // Ignore JSON parse failures and use fallback message.
        }
        throw new Error(message);
    }

    return response.json() as Promise<T>;
}

function adminHeaders(adminUserId: number): HeadersInit {
    return { "x-user-id": String(adminUserId) };
}

export async function fetchBootstrap(): Promise<BootstrapResponse> {
    return request<BootstrapResponse>("/bootstrap");
}

export async function login(email: string, password: string): Promise<User> {
    const result = await request<{ user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });

    return result.user;
}

export async function register(name: string, email: string, password: string): Promise<User> {
    const result = await request<{ user: User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
    });

    return result.user;
}

export async function fetchUsers(adminUserId: number): Promise<User[]> {
    const result = await request<{ users: User[] }>("/users", {
        method: "GET",
        headers: adminHeaders(adminUserId),
    });

    return result.users;
}

export async function adminCreateUser(
    adminUserId: number,
    payload: { name: string; email: string; password: string; role: User["role"] },
): Promise<User> {
    const result = await request<{ user: User }>("/users", {
        method: "POST",
        headers: adminHeaders(adminUserId),
        body: JSON.stringify(payload),
    });

    return result.user;
}

export async function adminUpdateUser(
    adminUserId: number,
    userId: number,
    payload: { name?: string; email?: string; role?: User["role"]; password?: string },
): Promise<User> {
    const result = await request<{ user: User }>(`/users/${userId}`, {
        method: "PATCH",
        headers: adminHeaders(adminUserId),
        body: JSON.stringify(payload),
    });

    return result.user;
}

export async function adminDeleteUser(adminUserId: number, userId: number): Promise<void> {
    await request<unknown>(`/users/${userId}`, {
        method: "DELETE",
        headers: adminHeaders(adminUserId),
    });
}

export async function fetchGroups(search?: string): Promise<Group[]> {
    const query = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
    const result = await request<{ groups: Group[] }>(`/groups${query}`);
    return result.groups;
}

export async function requestJoinGroup(studentId: number, groupId: number): Promise<Group> {
    const result = await request<{ group: Group }>(`/groups/${groupId}/join-requests`, {
        method: "POST",
        headers: { "x-user-id": String(studentId) },
    });

    return result.group;
}

export async function leaderApproveJoinRequest(leaderId: number, groupId: number, userId: number): Promise<Group> {
    const result = await request<{ group: Group }>(`/groups/${groupId}/requests/${userId}/approve`, {
        method: "POST",
        headers: { "x-user-id": String(leaderId) },
    });

    return result.group;
}

export async function leaderRejectJoinRequest(leaderId: number, groupId: number, userId: number): Promise<Group> {
    const result = await request<{ group: Group }>(`/groups/${groupId}/requests/${userId}/reject`, {
        method: "POST",
        headers: { "x-user-id": String(leaderId) },
    });

    return result.group;
}

export async function supervisorApproveGroup(supervisorId: number, groupId: number): Promise<Group> {
    const result = await request<{ group: Group }>(`/groups/${groupId}/approve`, {
        method: "POST",
        headers: { "x-user-id": String(supervisorId) },
    });

    return result.group;
}

export async function completeGroup(actorId: number, groupId: number): Promise<Group> {
    const result = await request<{ group: Group }>(`/groups/${groupId}/complete`, {
        method: "POST",
        headers: { "x-user-id": String(actorId) },
    });

    return result.group;
}

export async function createTask(
    actorId: number,
    payload: { title: string; description: string; groupId: number; assigneeId: number; priority: string; dueDate: string },
): Promise<Task> {
    const result = await request<{ task: Task }>("/tasks", {
        method: "POST",
        headers: { "x-user-id": String(actorId) },
        body: JSON.stringify(payload),
    });

    return result.task;
}

export async function updateTask(
    actorId: number,
    taskId: number,
    payload: { title?: string; description?: string; status?: string; priority?: string; dueDate?: string; assigneeId?: number },
): Promise<Task> {
    const result = await request<{ task: Task }>(`/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "x-user-id": String(actorId) },
        body: JSON.stringify(payload),
    });

    return result.task;
}

export async function deleteTask(actorId: number, taskId: number): Promise<void> {
    await request<unknown>(`/tasks/${taskId}`, {
        method: "DELETE",
        headers: { "x-user-id": String(actorId) },
    });
}
