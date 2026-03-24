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
