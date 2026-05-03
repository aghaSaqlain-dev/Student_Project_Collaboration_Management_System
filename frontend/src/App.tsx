import { useEffect, useState } from "react";
import { fetchBootstrap, login, register } from "./api";
import type { User, Group, Task, WorkLog } from "./types";
import { AppContext } from "./context/AppContext";
import { LoginPage } from "./components/LoginPage";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { GroupsPage } from "./pages/GroupsPage";
import { TasksPage } from "./pages/TasksPage";
import { WorkLogsPage } from "./pages/WorkLogsPage";
import { UsersPage } from "./pages/UsersPage";

export default function App() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [users, setUsers] = useState<User[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
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
            const { fetchUsers } = await import("./api");
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
        worklogs: <WorkLogsPage />,
        users: <UsersPage />,
    };

    return (
        <AppContext.Provider value={{ user: currentUser, users, setUsers, groups, setGroups, tasks, setTasks, workLogs, setWorkLogs }}>
            <div className="app-shell">
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser} onLogout={() => setCurrentUser(null)} />
                <main className="main">
                    {pages[activeTab] || <Dashboard />}
                </main>
            </div>
        </AppContext.Provider>
    );
}
