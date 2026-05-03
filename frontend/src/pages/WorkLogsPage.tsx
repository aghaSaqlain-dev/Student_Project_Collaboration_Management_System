import { useEffect, useState } from "react";
import {
    approveWorkLog,
    fetchGroupWorkLogs,
    submitWorkLog,
} from "../api";
import type { WorkLog } from "../types";
import { Icon } from "../components/Icon";
import { useApp } from "../context/AppContext";

export function WorkLogsPage() {
    const { user, users, groups, workLogs, setWorkLogs } = useApp();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
    const [newLog, setNewLog] = useState({ groupId: "", title: "", details: "", hours: "", date: "" });

    const myGroups = groups.filter((g) => g.members.includes(user.id) || g.leaderId === user.id);
    const visibleGroups = user.role === "admin" ? groups : myGroups;
    const visibleGroupIds = new Set<number>(visibleGroups.map((g) => g.id));

    useEffect(() => {
        const loadWorkLogs = async () => {
            if (!visibleGroups.length) {
                setWorkLogs([]);
                return;
            }

            setBusy(true);
            setError("");
            try {
                const allLogs = await Promise.all(visibleGroups.map((group) => fetchGroupWorkLogs(group.id, showVerifiedOnly)));
                setWorkLogs(allLogs.flat().sort((a, b) => b.id - a.id));
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load work logs.");
            } finally {
                setBusy(false);
            }
        };

        void loadWorkLogs();
    }, [groups, setWorkLogs, showVerifiedOnly, user.id, user.role]);

    const getUserName = (id: number) => users.find((u) => u.id === id)?.name ?? `User ${id}`;
    const getGroupName = (id: number) => groups.find((g) => g.id === id)?.name ?? `Group ${id}`;

    const canApprove = (log: WorkLog): boolean => {
        if (log.status === "verified") {
            return false;
        }

        if (log.submittedBy === user.id) {
            return false;
        }

        const group = groups.find((g) => g.id === log.groupId);
        if (!group) {
            return false;
        }

        const isPeer = group.members.includes(user.id) || group.leaderId === user.id;
        return isPeer && !log.approvedBy.includes(user.id);
    };

    const handleSubmitLog = async () => {
        const groupId = Number(newLog.groupId);
        const hours = Number(newLog.hours);

        if (!groupId || !newLog.title.trim() || !newLog.details.trim() || !newLog.date.trim() || Number.isNaN(hours)) {
            setError("Please fill all work log fields.");
            return;
        }

        setBusy(true);
        setError("");
        try {
            const created = await submitWorkLog(user.id, {
                groupId,
                title: newLog.title,
                details: newLog.details,
                hours,
                date: newLog.date,
            });

            setWorkLogs((current) => [created, ...current]);
            setNewLog({ groupId: "", title: "", details: "", hours: "", date: "" });
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to submit work log.");
        } finally {
            setBusy(false);
        }
    };

    const handleApproveLog = async (logId: number) => {
        setBusy(true);
        setError("");
        try {
            const updated = await approveWorkLog(user.id, logId);
            setWorkLogs((current) => current.map((log) => (log.id === updated.id ? updated : log)));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to approve work log.");
        } finally {
            setBusy(false);
        }
    };

    const visibleLogs = workLogs.filter((log) => visibleGroupIds.has(log.groupId));

    return (
        <div className="fade-in">
            <div className="flex items-center justify-between mb-20">
                <div className="page-header" style={{ margin: 0 }}>
                    <h2>Work Logs</h2>
                    <p>Submit updates, get peer verification, and keep immutable records</p>
                </div>
            </div>

            {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

            {user.role !== "admin" && (
                <div className="card" style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Submit Work Log</h3>
                    <div className="form-group">
                        <label className="form-label">Group</label>
                        <select className="form-select" value={newLog.groupId} onChange={e => setNewLog({ ...newLog, groupId: e.target.value })}>
                            <option value="">Select group</option>
                            {myGroups.map((group) => (
                                <option key={group.id} value={group.id}>{group.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Title</label>
                        <input className="form-input" value={newLog.title} onChange={e => setNewLog({ ...newLog, title: e.target.value })} placeholder="Implemented login validation" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Details</label>
                        <textarea className="form-textarea" value={newLog.details} onChange={e => setNewLog({ ...newLog, details: e.target.value })} placeholder="Describe your contribution for this work session..." />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Hours</label>
                            <input className="form-input" type="number" min="0.5" step="0.5" value={newLog.hours} onChange={e => setNewLog({ ...newLog, hours: e.target.value })} placeholder="2" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Date</label>
                            <input className="form-input" type="date" value={newLog.date} onChange={e => setNewLog({ ...newLog, date: e.target.value })} />
                        </div>
                    </div>
                    <button className="btn btn-primary" onClick={() => void handleSubmitLog()} disabled={busy}>
                        <Icon name="plus" size={14} /> Submit Work Log
                    </button>
                </div>
            )}

            <div className="card" style={{ marginBottom: 16 }}>
                <div className="flex items-center justify-between">
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>Submitted Logs</h3>
                    <label className="worklog-toggle">
                        <input
                            type="checkbox"
                            checked={showVerifiedOnly}
                            onChange={(e) => setShowVerifiedOnly(e.target.checked)}
                        />
                        <span>Verified only</span>
                    </label>
                </div>
            </div>

            <div className="card-grid card-grid-2">
                {visibleLogs.map((log) => (
                    <div key={log.id} className="card">
                        <div className="flex items-center justify-between mb-16">
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 700 }}>{log.title}</div>
                                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                                    {getGroupName(log.groupId)} · {log.hours}h · {log.date}
                                </div>
                            </div>
                            <span className={`badge badge-${log.status}`}>{log.status}</span>
                        </div>

                        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>{log.details}</p>

                        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
                            Submitted by: {getUserName(log.submittedBy)}<br />
                            Approvals: {log.approvedBy.length ? log.approvedBy.map(getUserName).join(", ") : "None yet"}
                        </div>

                        {log.status === "verified" ? (
                            <div className="worklog-locked">Verified and locked. This log cannot be modified.</div>
                        ) : (
                            canApprove(log) && (
                                <button className="btn btn-success" onClick={() => void handleApproveLog(log.id)} disabled={busy}>
                                    <Icon name="check" size={13} /> Approve as Peer
                                </button>
                            )
                        )}
                    </div>
                ))}
            </div>

            {!visibleLogs.length && (
                <div className="empty">No work logs found for your visible groups.</div>
            )}
        </div>
    );
}
