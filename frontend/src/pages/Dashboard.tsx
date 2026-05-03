import { useApp } from "../context/AppContext";

export function Dashboard() {
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
