import type { BootstrapResponse, User } from "./types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
        headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
        ...init,
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
