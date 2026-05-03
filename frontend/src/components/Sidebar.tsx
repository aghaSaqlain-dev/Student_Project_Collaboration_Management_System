import type { User } from "../types";
import { Icon } from "./Icon";

interface SidebarProps {
    activeTab: string;
    setActiveTab: (v: string) => void;
    user: User;
    onLogout: () => void;
}

export function Sidebar({ activeTab, setActiveTab, user, onLogout }: SidebarProps) {
    const navItems = [
        { key: "dashboard", label: "Dashboard", icon: "dashboard" },
        { key: "groups", label: "Groups", icon: "groups" },
        { key: "tasks", label: "Tasks", icon: "tasks" },
        { key: "worklogs", label: "Work Logs", icon: "edit" },
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
