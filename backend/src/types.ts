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

export type WorkLogStatus = "pending" | "verified";

// FR-5: Work Log Verification
export interface WorkLog {
    id: number;
    groupId: number;
    submittedBy: number;
    title: string;
    details: string;
    hours: number;
    date: string;
    submittedAt: string;
    approvedBy: number[];
    status: WorkLogStatus;
    verifiedAt?: string;
}

// FR-6: Progress Submission
export interface ProgressReport {
    id: number;
    groupId: number;
    submittedBy: number;
    title: string;
    content: string;
    type: "weekly" | "monthly";
    submittedAt: string;
    supervisorFeedback?: string;
    reviewedBy?: number;
}

// FR-7: Evaluation & Feedback
export interface Evaluation {
    id: number;
    groupId: number;
    supervisorId: number;
    score: number;
    feedback: string;
    evaluatedAt: string;
}

// FR-8: Admin Controls
export interface SystemSettings {
    maxTeamSize: number;
    submissionDeadline: string;
    registrationDeadline: string;
}