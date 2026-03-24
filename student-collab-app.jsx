import { useState, createContext, useContext, useEffect } from "react";

/* ─────────────────────────────────────────────
   HARDCODED DATA
───────────────────────────────────────────── */
const INITIAL_USERS = [
  { id: 1, name: "Ali Hassan",      email: "ali@uni.edu",      password: "student123", role: "student",    avatar: "AH" },
  { id: 2, name: "Sara Khan",       email: "sara@uni.edu",     password: "student123", role: "student",    avatar: "SK" },
  { id: 3, name: "Bilal Ahmed",     email: "bilal@uni.edu",    password: "student123", role: "student",    avatar: "BA" },
  { id: 4, name: "Zara Malik",      email: "zara@uni.edu",     password: "student123", role: "student",    avatar: "ZM" },
  { id: 5, name: "Dr. Noman",       email: "noman@uni.edu",    password: "super123",   role: "supervisor", avatar: "DN" },
  { id: 6, name: "Dr. Ayesha",      email: "ayesha@uni.edu",   password: "super123",   role: "supervisor", avatar: "DA" },
  { id: 7, name: "Admin User",      email: "admin@uni.edu",    password: "admin123",   role: "admin",      avatar: "AU" },
];

const INITIAL_GROUPS = [
  {
    id: 1, name: "AI Vision Lab", description: "Computer vision & ML project using PyTorch",
    status: "active", supervisorId: 5, leaderId: 1,
    members: [1, 2], maxSize: 4, tags: ["AI", "Python", "ML"],
    pendingRequests: [3],
  },
  {
    id: 2, name: "BlockChain Edu", description: "Decentralized academic record system on Ethereum",
    status: "open", supervisorId: 6, leaderId: 3,
    members: [3], maxSize: 3, tags: ["Blockchain", "Web3", "Solidity"],
    pendingRequests: [],
  },
  {
    id: 3, name: "EcoTrack App", description: "Mobile app for carbon footprint tracking",
    status: "formed", supervisorId: 5, leaderId: 4,
    members: [4, 2], maxSize: 4, tags: ["Mobile", "React Native", "IoT"],
    pendingRequests: [],
  },
  {
    id: 4, name: "MedBot Assistant", description: "AI-powered medical Q&A chatbot for students",
    status: "open", supervisorId: null, leaderId: 2,
    members: [2], maxSize: 5, tags: ["NLP", "Healthcare", "Python"],
    pendingRequests: [],
  },
];

const INITIAL_TASKS = [
  { id: 1, groupId: 1, title: "Dataset Collection",       description: "Gather 5000+ labeled images",        assigneeId: 2, status: "done",        priority: "high",   createdBy: 1, dueDate: "2025-04-10" },
  { id: 2, groupId: 1, title: "Model Architecture",       description: "Design CNN model layers",             assigneeId: 1, status: "in-progress", priority: "high",   createdBy: 1, dueDate: "2025-04-20" },
  { id: 3, groupId: 1, title: "UI Dashboard",             description: "Build frontend result viewer",        assigneeId: 2, status: "todo",        priority: "medium", createdBy: 1, dueDate: "2025-05-01" },
  { id: 4, groupId: 2, title: "Smart Contract Design",    description: "Write Solidity contracts",            assigneeId: 3, status: "in-progress", priority: "high",   createdBy: 3, dueDate: "2025-04-25" },
  { id: 5, groupId: 3, title: "Wireframe Design",         description: "Create Figma mockups",                assigneeId: 4, status: "todo",        priority: "medium", createdBy: 4, dueDate: "2025-04-18" },
];

/* ─────────────────────────────────────────────
   CONTEXT
───────────────────────────────────────────── */
const AppContext = createContext(null);

const useApp = () => useContext(AppContext);

/* ─────────────────────────────────────────────
   RBAC PERMISSIONS
───────────────────────────────────────────── */
const PERMISSIONS = {
  student:    ["view_groups", "join_group", "create_group", "view_tasks", "update_own_task", "view_own_profile"],
  supervisor: ["view_groups", "approve_group", "view_tasks", "view_all_profiles", "manage_group_status"],
  admin:      ["view_groups", "view_tasks", "view_all_profiles", "manage_users", "delete_user", "assign_roles"],
};

const can = (role, permission) => PERMISSIONS[role]?.includes(permission) ?? false;

/* ─────────────────────────────────────────────
   STYLES  (injected once)
───────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:        #0d0f14;
  --surface:   #141720;
  --surface2:  #1c2030;
  --border:    #252a3a;
  --accent:    #5d6bff;
  --accent2:   #ff6b6b;
  --accent3:   #00e5a0;
  --text:      #e8eaf2;
  --muted:     #6b7280;
  --radius:    12px;
  --shadow:    0 4px 24px rgba(0,0,0,0.5);
}

body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100vh; }

h1,h2,h3,h4,h5 { font-family: 'Syne', sans-serif; }

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

/* Layout */
.app-shell { display: flex; min-height: 100vh; }
.sidebar { width: 240px; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 24px 0; position: fixed; top: 0; left: 0; height: 100vh; z-index: 100; }
.main { margin-left: 240px; flex: 1; padding: 32px; min-height: 100vh; }

/* Brand */
.brand { padding: 0 20px 28px; border-bottom: 1px solid var(--border); }
.brand h1 { font-size: 18px; font-weight: 800; color: var(--accent); letter-spacing: -0.5px; }
.brand p { font-size: 11px; color: var(--muted); margin-top: 2px; }

/* Nav */
.nav { flex: 1; padding: 16px 12px; display: flex; flex-direction: column; gap: 4px; }
.nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; color: var(--muted); transition: all 0.15s; border: none; background: none; width: 100%; text-align: left; }
.nav-item:hover { color: var(--text); background: var(--surface2); }
.nav-item.active { color: var(--accent); background: rgba(93,107,255,0.12); }
.nav-item svg { flex-shrink: 0; }

/* User Badge */
.user-badge { margin: 0 12px; padding: 12px; background: var(--surface2); border-radius: var(--radius); border: 1px solid var(--border); }
.user-badge .ub-name { font-size: 13px; font-weight: 600; color: var(--text); }
.user-badge .ub-role { font-size: 11px; color: var(--muted); margin-top: 2px; }
.logout-btn { margin: 12px; padding: 10px; background: none; border: 1px solid var(--border); color: var(--muted); border-radius: 8px; cursor: pointer; font-size: 13px; font-family: inherit; transition: all 0.15s; }
.logout-btn:hover { border-color: var(--accent2); color: var(--accent2); }

/* Page Header */
.page-header { margin-bottom: 28px; }
.page-header h2 { font-size: 28px; font-weight: 800; letter-spacing: -1px; }
.page-header p { color: var(--muted); font-size: 14px; margin-top: 4px; }

/* Cards */
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
.card-grid { display: grid; gap: 16px; }
.card-grid-2 { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
.card-grid-3 { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }

/* Stat Cards */
.stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; margin-bottom: 28px; }
.stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
.stat-card .stat-val { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; }
.stat-card .stat-label { font-size: 12px; color: var(--muted); margin-top: 4px; }

/* Badges */
.badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.badge-open    { background: rgba(0,229,160,0.12); color: var(--accent3); }
.badge-formed  { background: rgba(255,193,7,0.12); color: #ffc107; }
.badge-active  { background: rgba(93,107,255,0.12); color: var(--accent); }
.badge-completed { background: rgba(107,114,128,0.12); color: var(--muted); }
.badge-student    { background: rgba(93,107,255,0.12); color: var(--accent); }
.badge-supervisor { background: rgba(0,229,160,0.12); color: var(--accent3); }
.badge-admin      { background: rgba(255,107,107,0.12); color: var(--accent2); }
.badge-todo       { background: rgba(107,114,128,0.15); color: #9ca3af; }
.badge-in-progress { background: rgba(255,193,7,0.12); color: #ffc107; }
.badge-done       { background: rgba(0,229,160,0.12); color: var(--accent3); }
.badge-high       { background: rgba(255,107,107,0.12); color: var(--accent2); }
.badge-medium     { background: rgba(255,193,7,0.12); color: #ffc107; }
.badge-low        { background: rgba(0,229,160,0.12); color: var(--accent3); }

/* Tags */
.tag { display: inline-block; padding: 2px 8px; background: var(--surface2); border-radius: 4px; font-size: 11px; color: var(--muted); margin: 2px; }

/* Avatar */
.avatar { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: rgba(93,107,255,0.2); color: var(--accent); font-family: 'Syne', sans-serif; font-weight: 700; font-size: 12px; flex-shrink: 0; }
.avatar-lg { width: 48px; height: 48px; font-size: 16px; }

/* Buttons */
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; font-family: inherit; transition: all 0.15s; }
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover { background: #4a59f0; transform: translateY(-1px); }
.btn-ghost { background: transparent; color: var(--muted); border: 1px solid var(--border); }
.btn-ghost:hover { color: var(--text); border-color: var(--accent); }
.btn-danger { background: transparent; color: var(--accent2); border: 1px solid rgba(255,107,107,0.3); }
.btn-danger:hover { background: rgba(255,107,107,0.1); }
.btn-success { background: transparent; color: var(--accent3); border: 1px solid rgba(0,229,160,0.3); }
.btn-success:hover { background: rgba(0,229,160,0.1); }
.btn-sm { padding: 5px 12px; font-size: 12px; }

/* Forms */
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
.form-input, .form-select, .form-textarea { width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; color: var(--text); font-family: inherit; font-size: 14px; transition: border-color 0.15s; outline: none; }
.form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--accent); }
.form-textarea { resize: vertical; min-height: 80px; }
.form-select option { background: var(--surface2); }

/* Table */
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
thead th { text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--muted); border-bottom: 1px solid var(--border); }
tbody td { padding: 12px 14px; border-bottom: 1px solid rgba(37,42,58,0.5); vertical-align: middle; }
tbody tr:last-child td { border-bottom: none; }
tbody tr:hover td { background: rgba(255,255,255,0.02); }

/* Modal overlay */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px; }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 28px; width: 100%; max-width: 480px; box-shadow: var(--shadow); }
.modal h3 { font-size: 20px; font-weight: 800; margin-bottom: 20px; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }

/* Login Page */
.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); }
.login-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 40px; width: 100%; max-width: 400px; }
.login-card h1 { font-size: 26px; font-weight: 800; margin-bottom: 6px; }
.login-card .sub { color: var(--muted); font-size: 13px; margin-bottom: 28px; }
.login-hint { background: var(--surface2); border-radius: 8px; padding: 14px; margin-bottom: 20px; font-size: 12px; color: var(--muted); }
.login-hint strong { color: var(--text); }
.error-msg { background: rgba(255,107,107,0.1); border: 1px solid rgba(255,107,107,0.3); color: var(--accent2); padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 14px; }

/* Divider */
.divider { border: none; border-top: 1px solid var(--border); margin: 20px 0; }

/* Empty state */
.empty { text-align: center; padding: 40px 20px; color: var(--muted); font-size: 14px; }
.empty svg { opacity: 0.3; margin-bottom: 12px; }

/* Flex utils */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-8 { gap: 8px; }
.gap-12 { gap: 12px; }
.gap-16 { gap: 16px; }
.mb-16 { margin-bottom: 16px; }
.mb-20 { margin-bottom: 20px; }
.mt-8 { margin-top: 8px; }
.mt-12 { margin-top: 12px; }
.text-sm { font-size: 13px; }
.text-muted { color: var(--muted); }
.font-bold { font-weight: 700; }
.w-full { width: 100%; }

/* Progress bar */
.progress-bar { height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--accent); border-radius: 2px; transition: width 0.3s; }

/* Notification dot */
.notif-dot { display: inline-block; width: 8px; height: 8px; background: var(--accent2); border-radius: 50%; }

/* Search */
.search-bar { display: flex; gap: 10px; margin-bottom: 20px; }
.search-input { flex: 1; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; color: var(--text); font-family: inherit; font-size: 14px; outline: none; }
.search-input:focus { border-color: var(--accent); }

/* Tab bar */
.tab-bar { display: flex; gap: 4px; background: var(--surface2); border-radius: 10px; padding: 4px; margin-bottom: 24px; }
.tab-item { flex: 1; text-align: center; padding: 8px 12px; border-radius: 7px; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--muted); transition: all 0.15s; }
.tab-item.active { background: var(--surface); color: var(--text); box-shadow: 0 1px 4px rgba(0,0,0,0.3); }

/* Kanban */
.kanban { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.kanban-col { background: var(--surface2); border-radius: var(--radius); padding: 14px; }
.kanban-col-header { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--muted); margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; }
.kanban-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 14px; margin-bottom: 8px; cursor: default; }
.kanban-card:last-child { margin-bottom: 0; }

/* Chips */
.chip { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 11px; background: var(--surface2); color: var(--text); border: 1px solid var(--border); }

/* Responsive */
@media (max-width: 768px) {
  .sidebar { transform: translateX(-100%); }
  .main { margin-left: 0; padding: 16px; }
  .kanban { grid-template-columns: 1fr; }
}

/* Animations */
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.fade-in { animation: fadeIn 0.25s ease; }
`;

/* ─────────────────────────────────────────────
   ICONS (inline SVG)
───────────────────────────────────────────── */
const Icon = ({ name, size = 16 }) => {
  const icons = {
    dashboard: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    users:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    groups:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a8.38 8.38 0 0 1 13 0"/><path d="M1 21h2M21 21h2"/></svg>,
    tasks:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    plus:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    logout:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    search:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    check:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
    x:         <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    edit:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
    shield:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  };
  return icons[name] || null;
};

/* ─────────────────────────────────────────────
   LOGIN PAGE
───────────────────────────────────────────── */
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const user = INITIAL_USERS.find(u => u.email === email && u.password === password);
    if (user) { onLogin(user); }
    else setError("Invalid email or password.");
  };

  return (
    <div className="login-page">
      <div className="login-card fade-in">
        <h1>CollabSync</h1>
        <p className="sub">Student Project Collaboration Platform</p>
        <div className="login-hint">
          <strong>Demo Accounts:</strong><br />
          Student: ali@uni.edu / student123<br />
          Supervisor: noman@uni.edu / super123<br />
          Admin: admin@uni.edu / admin123
        </div>
        {error && <div className="error-msg">{error}</div>}
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} placeholder="your@uni.edu" />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="••••••••" />
        </div>
        <button className="btn btn-primary w-full" style={{ justifyContent: "center" }} onClick={handleLogin}>Sign In</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────── */
function Sidebar({ activeTab, setActiveTab, user, onLogout }) {
  const navItems = [
    { key: "dashboard", label: "Dashboard",       icon: "dashboard" },
    { key: "groups",    label: "Groups",           icon: "groups" },
    { key: "tasks",     label: "Tasks",            icon: "tasks" },
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

/* ─────────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────────── */
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
        <p>Here's what's happening in your workspace</p>
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

/* ─────────────────────────────────────────────
   GROUPS PAGE
───────────────────────────────────────────── */
function GroupsPage() {
  const { user, groups, setGroups, users } = useApp();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", description: "", tags: "", maxSize: 4 });

  const filtered = groups.filter(g => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
                        g.description.toLowerCase().includes(search.toLowerCase());
    if (tab === "all") return matchSearch;
    if (tab === "mine") return matchSearch && (g.members.includes(user.id) || g.leaderId === user.id);
    if (tab === "open") return matchSearch && g.status === "open";
    if (tab === "pending") return matchSearch && g.status === "formed";
    return matchSearch;
  });

  const getUserName = id => users.find(u => u.id === id)?.name || "Unknown";

  const handleJoin = (gid) => {
    setGroups(gs => gs.map(g => g.id === gid ? { ...g, pendingRequests: [...(g.pendingRequests || []), user.id] } : g));
  };

  const handleApproveRequest = (gid, uid) => {
    setGroups(gs => gs.map(g => g.id === gid
      ? { ...g, members: [...g.members, uid], pendingRequests: g.pendingRequests.filter(r => r !== uid) }
      : g));
  };

  const handleRejectRequest = (gid, uid) => {
    setGroups(gs => gs.map(g => g.id === gid
      ? { ...g, pendingRequests: g.pendingRequests.filter(r => r !== uid) }
      : g));
  };

  const handleApproveGroup = (gid) => {
    setGroups(gs => gs.map(g => g.id === gid ? { ...g, status: "active" } : g));
  };

  const handleCreateGroup = () => {
    if (!newGroup.name.trim()) return;
    const g = {
      id: Date.now(), name: newGroup.name, description: newGroup.description,
      status: "open", supervisorId: null, leaderId: user.id,
      members: [user.id], maxSize: parseInt(newGroup.maxSize),
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

              {/* Leader: show pending requests */}
              {isLeader && g.pendingRequests?.length > 0 && (
                <div style={{ background: "var(--surface2)", borderRadius: 8, padding: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6, fontWeight: 600 }}>JOIN REQUESTS</div>
                  {g.pendingRequests.map(rid => (
                    <div key={rid} className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                      <span style={{ fontSize: 12 }}>{getUserName(rid)}</span>
                      <div className="flex gap-8">
                        <button className="btn btn-success btn-sm" onClick={() => handleApproveRequest(g.id, rid)}><Icon name="check" size={11} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleRejectRequest(g.id, rid)}><Icon name="x" size={11} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Supervisor: approve formed group */}
              {user.role === "supervisor" && g.status === "formed" && (
                <button className="btn btn-success w-full" style={{ justifyContent: "center" }} onClick={() => handleApproveGroup(g.id)}>
                  <Icon name="check" size={13} /> Approve Group
                </button>
              )}

              {/* Student: join button */}
              {user.role === "student" && !isMember && !hasPending && g.status === "open" && !isFull && (
                <button className="btn btn-primary w-full" style={{ justifyContent: "center" }} onClick={() => handleJoin(g.id)}>
                  Request to Join
                </button>
              )}
              {user.role === "student" && hasPending && (
                <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", padding: "8px 0" }}>⏳ Request pending...</div>
              )}
              {user.role === "student" && isMember && (
                <div style={{ textAlign: "center", fontSize: 12, color: "var(--accent3)", padding: "8px 0" }}>✓ You're a member</div>
              )}
              {isFull && !isMember && <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", padding: "8px 0" }}>Group is full</div>}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty">No groups found</div>
      )}

      {/* Create Group Modal */}
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
              <input className="form-input" type="number" min="2" max="10" value={newGroup.maxSize} onChange={e => setNewGroup({ ...newGroup, maxSize: e.target.value })} />
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

/* ─────────────────────────────────────────────
   TASKS PAGE
───────────────────────────────────────────── */
function TasksPage() {
  const { user, tasks, setTasks, groups, users } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [filterGroup, setFilterGroup] = useState("all");
  const [newTask, setNewTask] = useState({ title: "", description: "", assigneeId: "", groupId: "", priority: "medium", dueDate: "" });
  const [editTask, setEditTask] = useState(null);

  const myGroupIds = groups.filter(g => g.members.includes(user.id) || g.leaderId === user.id).map(g => g.id);
  const visibleGroupIds = user.role === "student" ? myGroupIds : groups.map(g => g.id);
  const visibleTasks = tasks.filter(t => visibleGroupIds.includes(t.groupId) && (filterGroup === "all" || t.groupId === parseInt(filterGroup)));

  const getGroupName = id => groups.find(g => g.id === id)?.name || "Unknown";
  const getUserName = id => users.find(u => u.id === id)?.name || "Unknown";

  const isLeader = (task) => {
    const g = groups.find(g => g.id === task.groupId);
    return g?.leaderId === user.id;
  };

  const handleCreateTask = () => {
    if (!newTask.title || !newTask.groupId) return;
    const t = { id: Date.now(), ...newTask, groupId: parseInt(newTask.groupId), assigneeId: parseInt(newTask.assigneeId), status: "todo", createdBy: user.id };
    setTasks(ts => [...ts, t]);
    setShowCreate(false);
    setNewTask({ title: "", description: "", assigneeId: "", groupId: "", priority: "medium", dueDate: "" });
  };

  const handleStatusChange = (tid, status) => {
    setTasks(ts => ts.map(t => t.id === tid ? { ...t, status } : t));
  };

  const handleDeleteTask = (tid) => {
    setTasks(ts => ts.filter(t => t.id !== tid));
  };

  const handleSaveEdit = () => {
    setTasks(ts => ts.map(t => t.id === editTask.id ? { ...t, ...editTask } : t));
    setEditTask(null);
  };

  const byStatus = (status) => visibleTasks.filter(t => t.status === status);

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
              <span style={{ background: "var(--surface)", padding: "2px 8px", borderRadius: 20, fontSize: 11 }}>{byStatus(status).length}</span>
            </div>
            {byStatus(status).map(task => (
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
                {/* Student can update their own task status */}
                {(task.assigneeId === user.id || isLeader(task) || user.role === "supervisor") && (
                  <select className="form-select" style={{ fontSize: 11, padding: "4px 8px" }} value={task.status} onChange={e => handleStatusChange(task.id, e.target.value)}>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                )}
              </div>
            ))}
            {byStatus(status).length === 0 && <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", padding: 20 }}>No tasks</div>}
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
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

      {/* Edit Task Modal */}
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
              <select className="form-select" value={editTask.priority} onChange={e => setEditTask({ ...editTask, priority: e.target.value })}>
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

/* ─────────────────────────────────────────────
   USER MANAGEMENT (Admin only)
───────────────────────────────────────────── */
function UsersPage() {
  const { user, users, setUsers } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "student" });
  const [search, setSearch] = useState("");

  if (!can(user.role, "manage_users")) {
    return <div className="empty"><Icon name="shield" size={32} /><br />Access Denied. Admin only.</div>;
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (!newUser.name || !newUser.email) return;
    const u = { id: Date.now(), ...newUser, avatar: newUser.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() };
    setUsers(us => [...us, u]);
    setShowCreate(false);
    setNewUser({ name: "", email: "", password: "", role: "student" });
  };

  const handleDelete = (uid) => {
    if (uid === user.id) return alert("Cannot delete yourself.");
    setUsers(us => us.filter(u => u.id !== uid));
  };

  const handleSaveEdit = () => {
    setUsers(us => us.map(u => u.id === editUser.id ? { ...u, ...editUser } : u));
    setEditUser(null);
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
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>
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

      {/* Create User Modal */}
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
              <input className="form-input" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="Password" />
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
              <button className="btn btn-primary" onClick={handleCreate}>Add User</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
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
              <select className="form-select" value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })}>
                <option value="student">Student</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setEditUser(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOT APP
───────────────────────────────────────────── */
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState(INITIAL_USERS);
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [tasks, setTasks] = useState(INITIAL_TASKS);

  // Inject styles once
  useEffect(() => {
    const id = "collabsync-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  if (!currentUser) return <LoginPage onLogin={setCurrentUser} />;

  const pages = {
    dashboard: <Dashboard />,
    groups:    <GroupsPage />,
    tasks:     <TasksPage />,
    users:     <UsersPage />,
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
