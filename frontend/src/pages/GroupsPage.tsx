import { useEffect, useState } from "react";
import {
    completeGroup,
    fetchGroups,
    leaderApproveJoinRequest,
    leaderRejectJoinRequest,
    requestJoinGroup,
    supervisorApproveGroup,
} from "../api";
import type { Group } from "../types";
import { Icon } from "../components/Icon";
import { useApp } from "../context/AppContext";
import { can } from "../utils/permissions";

export function GroupsPage() {
    const { user, groups, setGroups, users } = useApp();
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState("all");
    const [showCreate, setShowCreate] = useState(false);
    const [newGroup, setNewGroup] = useState({ name: "", description: "", tags: "", maxSize: 4 });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadGroups = async () => {
            try {
                const latestGroups = await fetchGroups(search);
                setGroups(latestGroups);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load groups.");
            }
        };

        void loadGroups();
    }, [search, setGroups]);

    const filtered = groups.filter(g => {
        const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
            g.description.toLowerCase().includes(search.toLowerCase());
        if (tab === "all") return matchSearch;
        if (tab === "mine") return matchSearch && (g.members.includes(user.id) || g.leaderId === user.id);
        if (tab === "open") return matchSearch && g.status === "open";
        if (tab === "pending") return matchSearch && g.status === "formed";
        return matchSearch;
    });

    const getUserName = (id: number) => users.find(u => u.id === id)?.name || "Unknown";

    const replaceGroup = (updatedGroup: Group) => {
        setGroups((current) => current.map((group) => (group.id === updatedGroup.id ? updatedGroup : group)));
    };

    const handleJoin = async (gid: number) => {
        setBusy(true);
        setError("");
        try {
            const updated = await requestJoinGroup(user.id, gid);
            replaceGroup(updated);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to request group join.");
        } finally {
            setBusy(false);
        }
    };

    const handleApproveRequest = async (gid: number, uid: number) => {
        setBusy(true);
        setError("");
        try {
            const updated = await leaderApproveJoinRequest(user.id, gid, uid);
            replaceGroup(updated);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to approve join request.");
        } finally {
            setBusy(false);
        }
    };

    const handleRejectRequest = async (gid: number, uid: number) => {
        setBusy(true);
        setError("");
        try {
            const updated = await leaderRejectJoinRequest(user.id, gid, uid);
            replaceGroup(updated);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to reject join request.");
        } finally {
            setBusy(false);
        }
    };

    const handleApproveGroup = async (gid: number) => {
        setBusy(true);
        setError("");
        try {
            const updated = await supervisorApproveGroup(user.id, gid);
            replaceGroup(updated);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to approve team.");
        } finally {
            setBusy(false);
        }
    };

    const handleCompleteGroup = async (gid: number) => {
        setBusy(true);
        setError("");
        try {
            const updated = await completeGroup(user.id, gid);
            replaceGroup(updated);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to mark group as completed.");
        } finally {
            setBusy(false);
        }
    };

    const handleCreateGroup = () => {
        if (!newGroup.name.trim()) return;
        const g: Group = {
            id: Date.now(), name: newGroup.name, description: newGroup.description,
            status: "open", supervisorId: null, leaderId: user.id,
            members: [user.id], maxSize: parseInt(String(newGroup.maxSize), 10),
            tags: newGroup.tags.split(",").map(t => t.trim()).filter(Boolean),
            pendingRequests: [],
        };
        setGroups(gs => [...gs, g]);
        setShowCreate(false);
        setNewGroup({ name: "", description: "", tags: "", maxSize: 4 });
    };

    const tabs = [
        { key: "all", label: "All Groups" },
        { key: "mine", label: "My Groups" },
        { key: "open", label: "Open" },
        ...(user.role === "supervisor" ? [{ key: "pending", label: "Pending Approval" }] : []),
    ];

    return (
        <div className="fade-in">
            <div className="flex items-center justify-between mb-20">
                <div className="page-header" style={{ margin: 0 }}>
                    <h2>Groups</h2>
                    <p>Discover and join project teams</p>
                </div>
                {can(user.role, "create_group") && (
                    <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                        <Icon name="plus" size={14} /> New Group
                    </button>
                )}
            </div>

            <div className="tab-bar">
                {tabs.map(t => (
                    <div key={t.key} className={`tab-item ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>{t.label}</div>
                ))}
            </div>

            <div className="search-bar">
                <input className="search-input" placeholder="Search groups by name or tech..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

            <div className="card-grid card-grid-2">
                {filtered.map(g => {
                    const isMember = g.members.includes(user.id) || g.leaderId === user.id;
                    const hasPending = g.pendingRequests?.includes(user.id);
                    const isFull = g.members.length >= g.maxSize;
                    const supervisor = users.find(u => u.id === g.supervisorId);
                    const isLeader = g.leaderId === user.id;

                    return (
                        <div key={g.id} className="card fade-in">
                            <div className="flex items-center justify-between mb-16">
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 700 }}>{g.name}</div>
                                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                                        Led by {getUserName(g.leaderId)}
                                    </div>
                                </div>
                                <span className={`badge badge-${g.status}`}>{g.status}</span>
                            </div>

                            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>{g.description}</p>

                            <div style={{ marginBottom: 12 }}>
                                {g.tags.map(t => <span key={t} className="tag">{t}</span>)}
                            </div>

                            <div className="flex items-center justify-between" style={{ marginBottom: 12, fontSize: 12, color: "var(--muted)" }}>
                                <span>👥 {g.members.length}/{g.maxSize} members</span>
                                {supervisor && <span>👨‍🏫 {supervisor.name}</span>}
                            </div>

                            {isLeader && g.pendingRequests?.length > 0 && (
                                <div style={{ background: "var(--surface2)", borderRadius: 8, padding: 10, marginBottom: 12 }}>
                                    <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>JOIN REQUESTS</div>
                                    {g.pendingRequests.map(rid => (
                                        <div key={rid} className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                                            <span style={{ fontSize: 12 }}>{getUserName(rid)}</span>
                                            <div className="flex gap-8">
                                                <button className="btn btn-success btn-sm" onClick={() => handleApproveRequest(g.id, rid)}><Icon name="check" size={11} /></button>
                                                <button className="btn btn-danger btn-sm" onClick={() => void handleRejectRequest(g.id, rid)}><Icon name="x" size={11} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {user.role === "supervisor" && g.status === "formed" && (
                                <button className="btn btn-success w-full" style={{ justifyContent: "center" }} onClick={() => void handleApproveGroup(g.id)} disabled={busy}>
                                    <Icon name="check" size={13} /> Approve Group
                                </button>
                            )}

                            {g.status === "active" && (user.role === "supervisor" || g.leaderId === user.id) && (
                                <button className="btn btn-ghost w-full" style={{ justifyContent: "center", marginTop: 6, borderColor: "rgba(0,229,160,0.3)", color: "var(--accent3)" }} onClick={() => void handleCompleteGroup(g.id)} disabled={busy}>
                                    <Icon name="check" size={13} /> Mark as Completed
                                </button>
                            )}

                            {g.status === "completed" && (
                                <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", padding: "8px 0", borderTop: "1px solid var(--border)", marginTop: 8 }}>
                                    ✅ Project completed — no further changes allowed
                                </div>
                            )}

                            {user.role === "student" && !isMember && !hasPending && g.status === "open" && !isFull && (
                                <button className="btn btn-primary w-full" style={{ justifyContent: "center" }} onClick={() => void handleJoin(g.id)} disabled={busy}>
                                    Request to Join
                                </button>
                            )}
                            {user.role === "student" && hasPending && (
                                <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", padding: "8px 0" }}>Request pending...</div>
                            )}
                            {user.role === "student" && isMember && g.status !== "completed" && (
                                <div style={{ textAlign: "center", fontSize: 12, color: "var(--accent3)", padding: "8px 0" }}>You are a member</div>
                            )}
                            {isFull && !isMember && g.status === "open" && (
                                <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", padding: "8px 0" }}>Group is full</div>
                            )}
                            {!isMember && !hasPending && g.status !== "open" && g.status !== "completed" && user.role === "student" && (
                                <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", padding: "8px 0" }}>
                                    🔒 {g.status === "formed" ? "Awaiting supervisor approval" : "Group is active"}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div className="empty">No groups found</div>
            )}

            {busy && <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 12 }}>Processing group request...</div>}

            {showCreate && (
                <div className="modal-overlay">
                    <div className="modal fade-in">
                        <h3>Create New Group</h3>
                        <div className="form-group">
                            <label className="form-label">Group Name</label>
                            <input className="form-input" value={newGroup.name} onChange={e => setNewGroup({ ...newGroup, name: e.target.value })} placeholder="e.g. AI Research Lab" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea className="form-textarea" value={newGroup.description} onChange={e => setNewGroup({ ...newGroup, description: e.target.value })} placeholder="Describe your project..." />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tags (comma-separated)</label>
                            <input className="form-input" value={newGroup.tags} onChange={e => setNewGroup({ ...newGroup, tags: e.target.value })} placeholder="Python, ML, WebApp" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Max Members</label>
                            <input className="form-input" type="number" min="2" max="10" value={newGroup.maxSize} onChange={e => setNewGroup({ ...newGroup, maxSize: Number(e.target.value) })} />
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreateGroup}>Create Group</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
