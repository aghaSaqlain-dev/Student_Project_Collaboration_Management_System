import { useEffect, useState } from "react";
import {
    adminCreateUser,
    adminDeleteUser,
    adminUpdateUser,
    fetchUsers,
} from "../api";
import type { Role, User } from "../types";
import { Icon } from "../components/Icon";
import { useApp } from "../context/AppContext";
import { can } from "../utils/permissions";

export function UsersPage() {
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
