import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { WorkLog } from "../types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..", "..");
const logsDir = path.join(backendRoot, "storage");
const logsFilePath = path.join(logsDir, "work-logs.txt");

function formatLine(event: string, workLog: WorkLog, actorId?: number): string {
    const actor = actorId !== undefined ? ` actor=${actorId}` : "";
    return [
        `[${new Date().toISOString()}]`,
        event,
        `logId=${workLog.id}`,
        `groupId=${workLog.groupId}`,
        `submittedBy=${workLog.submittedBy}`,
        `status=${workLog.status}`,
        `approvals=${workLog.approvedBy.join(",") || "none"}`,
        actor,
    ]
        .filter(Boolean)
        .join(" ");
}

export async function appendWorkLogEvent(event: string, workLog: WorkLog, actorId?: number): Promise<void> {
    await mkdir(logsDir, { recursive: true });
    await appendFile(logsFilePath, `${formatLine(event, workLog, actorId)}\n`, "utf8");
}
