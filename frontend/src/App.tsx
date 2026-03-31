import { createContext, useContext, useEffect, useState } from "react";
import {
    adminCreateUser,
    adminDeleteUser,
    adminUpdateUser,
    fetchBootstrap,
    fetchGroups,
    fetchUsers,
    leaderApproveJoinRequest,
    leaderRejectJoinRequest,
    login,
    register,
    requestJoinGroup,
    supervisorApproveGroup,
} from "./api";
import type { Group, Role, Task, User } from "./types";

interface AppContextType {
    user: User;
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    groups: Group[];
    setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const AppContext = createContext<AppContextType | null>(null);

const useApp = (): AppContextType => {
    const ctx = useContext(AppContext);
    if (!ctx) {
        throw new Error("useApp must be used inside AppContext.Provider");
    }
    return ctx;
};

const PERMISSIONS: Record<Role, string[]> = {
    student: ["view_groups", "join_group", "create_group", "view_tasks", "update_own_task", "view_own_profile"],
    supervisor: ["view_groups", "approve_group", "view_tasks", "view_all_profiles", "manage_group_status"],
    admin: ["view_groups", "view_tasks", "view_all_profiles", "manage_users", "delete_user", "assign_roles"],
};

const can = (role: Role, permission: string): boolean => PERMISSIONS[role]?.includes(permission) ?? false;

const Icon = ({ name, size = 16 }: { name: string; size?: number }) => {
    const icons: Record<string, JSX.Element> = {
        dashboard: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
        users: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
        groups: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4" /><path d="M5.5 21a8.38 8.38 0 0 1 13 0" /><path d="M1 21h2M21 21h2" /></svg>,
        tasks: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
        plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
        logout: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
        check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>,
        x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
        edit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
        trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>,
        shield: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    };
    return icons[name] || null;
};

function LoginPage({
    onLogin,
    onRegister,
}: {
    onLogin: (email: string, password: string) => Promise<void>;
    onRegister: (name: string, email: string, password: string) => Promise<void>;
}) {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const handleSubmit = async () => {
        setError("");

        if (mode === "register" && password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setBusy(true);
        try {
            if (mode === "login") {
                await onLogin(email, password);
            } else {
                await onRegister(name, email, password);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Authentication failed.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card fade-in">
                <h1>CollabSync</h1>
                <p className="sub">Student Project Collaboration Platform</p>
                <div className="tab-bar" style={{ marginBottom: 16 }}>
                    <div className={`tab-item ${mode === "login" ? "active" : ""}`} onClick={() => { setMode("login"); setError(""); }}>
                        Login
                    </div>
                    <div className={`tab-item ${mode === "register" ? "active" : ""}`} onClick={() => { setMode("register"); setError(""); }}>
                        Register
                    </div>
                </div>
                <div className="login-hint">
                    <strong>Demo Accounts:</strong><br />
                    Student: ali@uni.edu / student123<br />
                    Supervisor: noman@uni.edu / super123<br />
                    Admin: admin@uni.edu / admin123
                </div>
                {error && <div className="error-msg">{error}</div>}
                {mode === "register" && (
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input className="form-input" value={name} onChange={e => { setName(e.target.value); setError(""); }} placeholder="Your name" />
                    </div>
                )}
                <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} placeholder="your@uni.edu" />
                </div>
                <div className="form-group">
                    <label className="form-label">Password</label>
                    <input className="form-input" type="password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="••••••••" />
                </div>
                {mode === "register" && (
                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input className="form-input" type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && handleSubmit()} placeholder="••••••••" />
                    </div>
                )}
                <button className="btn btn-primary w-full" style={{ justifyContent: "center" }} onClick={handleSubmit} disabled={busy}>
                    {busy ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
                </button>
            </div>
        </div>
    );
}

function Sidebar({ activeTab, setActiveTab, user, onLogout }: { activeTab: string; setActiveTab: (v: string) => void; user: User; onLogout: () => void }) {
    const navItems = [
        { key: "dashboard", label: "Dashboard", icon: "dashboard" },
        { key: "groups", label: "Groups", icon: "groups" },
        { key: "tasks", label: "Tasks", icon: "tasks" },
        ...(user.role === "admin" ? [{ key: "users", label: "User Management", icon: "users" }] : []),
    ];

    return (
        <aside className="sidebar">
            <div className="brand">
                <h1>CollabSync</h1>
                <p>Project Management</p>
            </div>
            <nav className="nav">
                {navItems.map(item => (
                    <button key={item.key} className={`nav-item ${activeTab === item.key ? "active" : ""}`} onClick={() => setActiveTab(item.key)}>
                        <Icon name={item.icon} size={16} />
                        {item.label}
                    </button>
                ))}
            </nav>
            <div className="user-badge">
                <div className="flex items-center gap-8">
                    <div className="avatar">{user.avatar}</div>
                    <div>
                        <div className="ub-name">{user.name}</div>
                        <div className="ub-role" style={{ textTransform: "capitalize" }}>{user.role}</div>
                    </div>
                </div>
            </div>
            <button className="logout-btn" onClick={onLogout}><Icon name="logout" size={14} /> Sign Out</button>
        </aside>
    );
}

function Dashboard() {
    const { user, groups, tasks, users } = useApp();

    const myGroups = groups.filter(g => g.members.includes(user.id) || g.leaderId === user.id);
    const myTasks = tasks.filter(t => t.assigneeId === user.id);
    const pending = groups.filter(g => g.pendingRequests?.includes(user.id));

    const statsStudent = [
        { label: "My Groups", val: myGroups.length, color: "var(--accent)" },
        { label: "My Tasks", val: myTasks.length, color: "#ffc107" },
        { label: "Done Tasks", val: myTasks.filter(t => t.status === "done").length, color: "var(--accent3)" },
        { label: "Pending Joins", val: pending.length, color: "var(--accent2)" },
    ];
    const statsSuper = [
        { label: "Total Groups", val: groups.length, color: "var(--accent)" },
        { label: "Pending Approval", val: groups.filter(g => g.status === "formed").length, color: "#ffc107" },
        { label: "Active Projects", val: groups.filter(g => g.status === "active").length, color: "var(--accent3)" },
        { label: "Total Tasks", val: tasks.length, color: "var(--accent2)" },
    ];
    const statsAdmin = [
        { label: "Total Users", val: users.length, color: "var(--accent)" },
        { label: "Students", val: users.filter(u => u.role === "student").length, color: "#ffc107" },
        { label: "Supervisors", val: users.filter(u => u.role === "supervisor").length, color: "var(--accent3)" },
        { label: "Total Groups", val: groups.length, color: "var(--accent2)" },
    ];

    const stats = user.role === "admin" ? statsAdmin : user.role === "supervisor" ? statsSuper : statsStudent;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h2>Welcome back, {user.name.split(" ")[0]} 👋</h2>
                <p>Here is what is happening in your workspace</p>
            </div>

            <div className="stat-grid">
                {stats.map(s => (
                    <div key={s.label} className="stat-card">
                        <div className="stat-val" style={{ color: s.color }}>{s.val}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="card">
                    <div className="flex items-center justify-between mb-16">
                        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent Groups</h3>
                    </div>
                    {groups.slice(0, 4).map(g => (
                        <div key={g.id} className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{g.name}</div>
                                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{g.members.length} members</div>
                            </div>
                            <span className={`badge badge-${g.status}`}>{g.status}</span>
                        </div>
                    ))}
                </div>

                <div className="card">
                    <div className="flex items-center justify-between mb-16">
                        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Task Overview</h3>
                    </div>
                    {["todo", "in-progress", "done"].map(status => {
                        const count = tasks.filter(t => t.status === status).length;
                        const pct = Math.round((count / tasks.length) * 100) || 0;
                        return (
                            <div key={status} style={{ marginBottom: 12 }}>
                                <div className="flex justify-between" style={{ marginBottom: 4 }}>
                                    <span style={{ fontSize: 12, textTransform: "capitalize" }}>{status.replace("-", " ")}</span>
                                    <span style={{ fontSize: 12, color: "var(--muted)" }}>{count}</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${pct}%`, background: status === "done" ? "var(--accent3)" : status === "in-progress" ? "#ffc107" : "var(--muted)" }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function GroupsPage() {
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

                            {user.role === "student" && !isMember && !hasPending && g.status === "open" && !isFull && (
                                <button className="btn btn-primary w-full" style={{ justifyContent: "center" }} onClick={() => void handleJoin(g.id)} disabled={busy}>
                                    Request to Join
                                </button>
                            )}
                            {user.role === "student" && hasPending && (
                                <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", padding: "8px 0" }}>Request pending...</div>
                            )}
                            {user.role === "student" && isMember && (
                                <div style={{ textAlign: "center", fontSize: 12, color: "var(--accent3)", padding: "8px 0" }}>You are a member</div>
                            )}
                            {isFull && !isMember && (
                                <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", padding: "8px 0" }}>Group is full</div>
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
            )
            }
        </div >
    );
}

function TasksPage() {
    const { user, tasks, setTasks, groups, users } = useApp();
    const [showCreate, setShowCreate] = useState(false);
    const [filterGroup, setFilterGroup] = useState("all");
    const [newTask, setNewTask] = useState({ title: "", description: "", assigneeId: "", groupId: "", priority: "medium", dueDate: "" });
    const [editTask, setEditTask] = useState<Task | null>(null);

    const myGroupIds = groups.filter(g => g.members.includes(user.id) || g.leaderId === user.id).map(g => g.id);
    const visibleGroupIds = user.role === "student" ? myGroupIds : groups.map(g => g.id);
    const visibleTasks = tasks.filter(t => visibleGroupIds.includes(t.groupId) && (filterGroup === "all" || t.groupId === parseInt(filterGroup, 10)));

    const getGroupName = (id: number) => groups.find(g => g.id === id)?.name || "Unknown";
    const getUserName = (id: number) => users.find(u => u.id === id)?.name || "Unknown";

    const isLeader = (task: Task) => {
        const g = groups.find(g => g.id === task.groupId);
        return g?.leaderId === user.id;
    };

    const handleCreateTask = () => {
        if (!newTask.title || !newTask.groupId) return;
        const assignee = parseInt(newTask.assigneeId, 10);
        const t: Task = {
            id: Date.now(),
            title: newTask.title,
            description: newTask.description,
            assigneeId: Number.isNaN(assignee) ? user.id : assignee,
            groupId: parseInt(newTask.groupId, 10),
            status: "todo",
            priority: newTask.priority as Task["priority"],
            createdBy: user.id,
            dueDate: newTask.dueDate,
        };
        setTasks(ts => [...ts, t]);
        setShowCreate(false);
        setNewTask({ title: "", description: "", assigneeId: "", groupId: "", priority: "medium", dueDate: "" });
    };

    const handleStatusChange = (tid: number, status: Task["status"]) => {
        setTasks(ts => ts.map(t => t.id === tid ? { ...t, status } : t));
    };

    const handleDeleteTask = (tid: number) => {
        setTasks(ts => ts.filter(t => t.id !== tid));
    };

    const handleSaveEdit = () => {
        if (!editTask) return;
        setTasks(ts => ts.map(t => t.id === editTask.id ? { ...t, ...editTask } : t));
        setEditTask(null);
    };

    const byStatus = (status: Task["status"]) => visibleTasks.filter(t => t.status === status);

    const leaderGroups = groups.filter(g => g.leaderId === user.id && g.status === "active");

    return (
        <div className="fade-in">
            <div className="flex items-center justify-between mb-20">
                <div className="page-header" style={{ margin: 0 }}>
                    <h2>Tasks</h2>
                    <p>Track and manage project tasks</p>
                </div>
                {(user.role === "student" && leaderGroups.length > 0) && (
                    <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                        <Icon name="plus" size={14} /> New Task
                    </button>
                )}
                {user.role === "supervisor" && (
                    <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                        <Icon name="plus" size={14} /> New Task
                    </button>
                )}
            </div>

            <div className="flex gap-12 mb-20">
                <select className="form-select" style={{ maxWidth: 200 }} value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
                    <option value="all">All Groups</option>
                    {groups.filter(g => visibleGroupIds.includes(g.id)).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
            </div>

            <div className="kanban">
                {["todo", "in-progress", "done"].map(status => (
                    <div key={status} className="kanban-col">
                        <div className="kanban-col-header">
                            <span>{status.replace("-", " ")}</span>
                            <span style={{ background: "var(--surface)", padding: "2px 8px", borderRadius: 20, fontSize: 11 }}>{byStatus(status as Task["status"]).length}</span>
                        </div>
                        {byStatus(status as Task["status"]).map(task => (
                            <div key={task.id} className="kanban-card fade-in">
                                <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                                    <div className="flex gap-8">
                                        {(isLeader(task) || user.role === "supervisor") && (
                                            <>
                                                <button className="btn btn-ghost btn-sm" style={{ padding: "3px 7px" }} onClick={() => setEditTask({ ...task })}>
                                                    <Icon name="edit" size={11} />
                                                </button>
                                                <button className="btn btn-danger btn-sm" style={{ padding: "3px 7px" }} onClick={() => handleDeleteTask(task.id)}>
                                                    <Icon name="trash" size={11} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{task.title}</div>
                                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>{task.description}</div>
                                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>
                                    📁 {getGroupName(task.groupId)}<br />
                                    👤 {getUserName(task.assigneeId)}<br />
                                    📅 {task.dueDate}
                                </div>
                                {(task.assigneeId === user.id || isLeader(task) || user.role === "supervisor") && (
                                    <select className="form-select" style={{ fontSize: 11, padding: "4px 8px" }} value={task.status} onChange={e => handleStatusChange(task.id, e.target.value as Task["status"])}>
                                        <option value="todo">To Do</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="done">Done</option>
                                    </select>
                                )}
                            </div>
                        ))}
                        {byStatus(status as Task["status"]).length === 0 && <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", padding: 20 }}>No tasks</div>}
                    </div>
                ))}
            </div>

            {showCreate && (
                <div className="modal-overlay">
                    <div className="modal fade-in">
                        <h3>Create Task</h3>
                        <div className="form-group">
                            <label className="form-label">Title</label>
                            <input className="form-input" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="Task title..." />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea className="form-textarea" value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} placeholder="Describe the task..." />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Group</label>
                            <select className="form-select" value={newTask.groupId} onChange={e => setNewTask({ ...newTask, groupId: e.target.value })}>
                                <option value="">Select group</option>
                                {groups.filter(g => g.status === "active" && (user.role === "supervisor" || g.leaderId === user.id)).map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Assignee</label>
                            <select className="form-select" value={newTask.assigneeId} onChange={e => setNewTask({ ...newTask, assigneeId: e.target.value })}>
                                <option value="">Select student</option>
                                {users.filter(u => u.role === "student").map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div className="form-group">
                                <label className="form-label">Priority</label>
                                <select className="form-select" value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Due Date</label>
                                <input className="form-input" type="date" value={newTask.dueDate} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} />
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreateTask}>Create Task</button>
                        </div>
                    </div>
                </div>
            )}

            {editTask && (
                <div className="modal-overlay">
                    <div className="modal fade-in">
                        <h3>Edit Task</h3>
                        <div className="form-group">
                            <label className="form-label">Title</label>
                            <input className="form-input" value={editTask.title} onChange={e => setEditTask({ ...editTask, title: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea className="form-textarea" value={editTask.description} onChange={e => setEditTask({ ...editTask, description: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Priority</label>
                            <select className="form-select" value={editTask.priority} onChange={e => setEditTask({ ...editTask, priority: e.target.value as Task["priority"] })}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Due Date</label>
                            <input className="form-input" type="date" value={editTask.dueDate} onChange={e => setEditTask({ ...editTask, dueDate: e.target.value })} />
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-ghost" onClick={() => setEditTask(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSaveEdit}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function UsersPage() {
    const { user, users, setUsers } = useApp();
    const [showCreate, setShowCreate] = useState(false);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "student" });
    const [editPassword, setEditPassword] = useState("");
    const [search, setSearch] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadUsers = async () => {
            if (user.role !== "admin") {
                return;
            }

            setBusy(true);
            setError("");
            try {
                const latestUsers = await fetchUsers(user.id);
                setUsers(latestUsers);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load users.");
            } finally {
                setBusy(false);
            }
        };

        void loadUsers();
    }, [setUsers, user.id, user.role]);

    if (!can(user.role, "manage_users")) {
        return <div className="empty"><Icon name="shield" size={32} /><br />Access Denied. Admin only.</div>;
    }

    const filtered = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreate = async () => {
        if (!newUser.name || !newUser.email || !newUser.password) {
            setError("Name, email, and password are required.");
            return;
        }

        setBusy(true);
        setError("");
        try {
            const created = await adminCreateUser(user.id, {
                name: newUser.name,
                email: newUser.email,
                password: newUser.password,
                role: newUser.role as Role,
            });
            setUsers((us) => [...us, created]);
            setShowCreate(false);
            setNewUser({ name: "", email: "", password: "", role: "student" });
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to create user.");
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async (uid: number) => {
        setBusy(true);
        setError("");
        try {
            await adminDeleteUser(user.id, uid);
            setUsers(us => us.filter(u => u.id !== uid));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to delete user.");
        } finally {
            setBusy(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!editUser) return;

        setBusy(true);
        setError("");
        try {
            const updated = await adminUpdateUser(user.id, editUser.id, {
                name: editUser.name,
                email: editUser.email,
                role: editUser.role,
                ...(editPassword.trim() ? { password: editPassword } : {}),
            });
            setUsers(us => us.map(u => u.id === updated.id ? updated : u));
            setEditUser(null);
            setEditPassword("");
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to update user.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fade-in">
            <div className="flex items-center justify-between mb-20">
                <div className="page-header" style={{ margin: 0 }}>
                    <h2>User Management</h2>
                    <p>Manage system users and roles</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                    <Icon name="plus" size={14} /> Add User
                </button>
            </div>

            <div className="search-bar">
                <input className="search-input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

            <div className="card">
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(u => (
                                <tr key={u.id}>
                                    <td>
                                        <div className="flex items-center gap-12">
                                            <div className="avatar">{u.avatar}</div>
                                            <span style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: 13, color: "var(--muted)" }}>{u.email}</td>
                                    <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                                    <td>
                                        <div className="flex gap-8">
                                            <button className="btn btn-ghost btn-sm" onClick={() => setEditUser({ ...u })}>
                                                <Icon name="edit" size={12} /> Edit
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => void handleDelete(u.id)} disabled={busy}>
                                                <Icon name="trash" size={12} /> Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showCreate && (
                <div className="modal-overlay">
                    <div className="modal fade-in">
                        <h3>Add New User</h3>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input className="form-input" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="Full name" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input className="form-input" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@uni.edu" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input className="form-input" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="Minimum 6 characters" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <select className="form-select" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                <option value="student">Student</option>
                                <option value="supervisor">Supervisor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={() => void handleCreate()} disabled={busy}>Add User</button>
                        </div>
                    </div>
                </div>
            )}

            {editUser && (
                <div className="modal-overlay">
                    <div className="modal fade-in">
                        <h3>Edit User</h3>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input className="form-input" value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input className="form-input" value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <select className="form-select" value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value as Role })}>
                                <option value="student">Student</option>
                                <option value="supervisor">Supervisor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">New Password (optional)</label>
                            <input className="form-input" type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="Leave empty to keep current" />
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-ghost" onClick={() => { setEditUser(null); setEditPassword(""); }}>Cancel</button>
                            <button className="btn btn-primary" onClick={() => void handleSaveEdit()} disabled={busy}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {busy && <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 12 }}>Processing user request...</div>}
        </div>
    );
}

export default function App() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [users, setUsers] = useState<User[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        const run = async () => {
            try {
                const data = await fetchBootstrap();
                setUsers(data.users);
                setGroups(data.groups);
                setTasks(data.tasks);
            } catch (e) {
                setLoadError(e instanceof Error ? e.message : "Failed to connect backend API.");
            } finally {
                setLoading(false);
            }
        };

        run();
    }, []);

    const handleLogin = async (email: string, password: string) => {
        const user = await login(email, password);
        if (user.role === "admin") {
            const latestUsers = await fetchUsers(user.id);
            setUsers(latestUsers);
        }
        setCurrentUser(user);
        setActiveTab("dashboard");
    };

    const handleRegister = async (name: string, email: string, password: string) => {
        const user = await register(name, email, password);
        setUsers((prev) => {
            const exists = prev.some((candidate) => candidate.id === user.id);
            return exists ? prev : [...prev, user];
        });
        setCurrentUser(user);
        setActiveTab("dashboard");
    };

    if (loading) {
        return (
            <div className="login-page">
                <div className="login-card fade-in">
                    <h1>CollabSync</h1>
                    <p className="sub">Loading data from backend...</p>
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="login-page">
                <div className="login-card fade-in">
                    <h1>Backend Unavailable</h1>
                    <p className="sub">Start backend server on port 4000 and refresh.</p>
                    <div className="error-msg">{loadError}</div>
                </div>
            </div>
        );
    }

    if (!currentUser) return <LoginPage onLogin={handleLogin} onRegister={handleRegister} />;

    const pages: Record<string, JSX.Element> = {
        dashboard: <Dashboard />,
        groups: <GroupsPage />,
        tasks: <TasksPage />,
        users: <UsersPage />,
    };

    return (
        <AppContext.Provider value={{ user: currentUser, users, setUsers, groups, setGroups, tasks, setTasks }}>
            <div className="app-shell">
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser} onLogout={() => setCurrentUser(null)} />
                <main className="main">
                    {pages[activeTab] || <Dashboard />}
                </main>
            </div>
        </AppContext.Provider>
    );
}
