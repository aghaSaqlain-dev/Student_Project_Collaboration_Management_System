import type { Evaluation, Group, ProgressReport, PublicUser, SystemSettings, Task, User } from "./types.js";

export const users: User[] = [
    { id: 1, name: "Ali Hassan", email: "ali@uni.edu", password: "student123", role: "student", avatar: "AH" },
    { id: 2, name: "Sara Khan", email: "sara@uni.edu", password: "student123", role: "student", avatar: "SK" },
    { id: 3, name: "Bilal Ahmed", email: "bilal@uni.edu", password: "student123", role: "student", avatar: "BA" },
    { id: 4, name: "Zara Malik", email: "zara@uni.edu", password: "student123", role: "student", avatar: "ZM" },
    { id: 5, name: "Dr. Noman", email: "noman@uni.edu", password: "super123", role: "supervisor", avatar: "DN" },
    { id: 6, name: "Dr. Ayesha", email: "ayesha@uni.edu", password: "super123", role: "supervisor", avatar: "DA" },
    { id: 7, name: "Admin User", email: "admin@uni.edu", password: "admin123", role: "admin", avatar: "AU" },
];

export const groups: Group[] = [
    {
        id: 1, name: "AI Vision Lab", description: "Computer vision & ML project using PyTorch",
        status: "active", supervisorId: 5, leaderId: 1,
        members: [1, 2], maxSize: 4, tags: ["AI", "Python", "ML"], pendingRequests: [3],
    },
    {
        id: 2, name: "BlockChain Edu", description: "Decentralized academic record system on Ethereum",
        status: "open", supervisorId: 6, leaderId: 3,
        members: [3], maxSize: 3, tags: ["Blockchain", "Web3", "Solidity"], pendingRequests: [],
    },
    {
        id: 3, name: "EcoTrack App", description: "Mobile app for carbon footprint tracking",
        status: "formed", supervisorId: 5, leaderId: 4,
        members: [4, 2], maxSize: 4, tags: ["Mobile", "React Native", "IoT"], pendingRequests: [],
    },
    {
        id: 4, name: "MedBot Assistant", description: "AI-powered medical Q&A chatbot for students",
        status: "open", supervisorId: null, leaderId: 2,
        members: [2], maxSize: 5, tags: ["NLP", "Healthcare", "Python"], pendingRequests: [],
    },
];

export const tasks: Task[] = [
    { id: 1, groupId: 1, title: "Dataset Collection", description: "Gather 5000+ labeled images", assigneeId: 2, status: "done", priority: "high", createdBy: 1, dueDate: "2025-04-10" },
    { id: 2, groupId: 1, title: "Model Architecture", description: "Design CNN model layers", assigneeId: 1, status: "in-progress", priority: "high", createdBy: 1, dueDate: "2025-04-20" },
    { id: 3, groupId: 1, title: "UI Dashboard", description: "Build frontend result viewer", assigneeId: 2, status: "todo", priority: "medium", createdBy: 1, dueDate: "2025-05-01" },
    { id: 4, groupId: 2, title: "Smart Contract Design", description: "Write Solidity contracts", assigneeId: 3, status: "in-progress", priority: "high", createdBy: 3, dueDate: "2025-04-25" },
    { id: 5, groupId: 3, title: "Wireframe Design", description: "Create Figma mockups", assigneeId: 4, status: "todo", priority: "medium", createdBy: 4, dueDate: "2025-04-18" },
];

export const progressReports: ProgressReport[] = [];
export const evaluations: Evaluation[] = [];
export let systemSettings: SystemSettings = {
    maxTeamSize: 5,
    submissionDeadline: "2025-06-30",
    registrationDeadline: "2025-05-01",
};

export function withoutPassword(user: User): PublicUser {
    const { password, ...rest } = user;
    return rest;
}