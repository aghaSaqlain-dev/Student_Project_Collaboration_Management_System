export type Role = "student" | "supervisor" | "admin";

export interface User {
    id: number;
    name: string;
    email: string;
    password: string;
    role: Role;
    avatar: string;
}

export interface PublicUser {
    id: number;
    name: string;
    email: string;
    role: Role;
    avatar: string;
}

export interface Group {
    id: number;
    name: string;
    description: string;
    status: "open" | "formed" | "active" | "completed";
    supervisorId: number | null;
    leaderId: number;
    members: number[];
    maxSize: number;
    tags: string[];
    pendingRequests: number[];
}

export interface Task {
    id: number;
    groupId: number;
    title: string;
    description: string;
    assigneeId: number;
    status: "todo" | "in-progress" | "done";
    priority: "low" | "medium" | "high";
    createdBy: number;
    dueDate: string;
}
