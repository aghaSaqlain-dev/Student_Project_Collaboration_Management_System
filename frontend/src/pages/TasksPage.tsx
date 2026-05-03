import { useState } from "react";
import {
    createTask,
    deleteTask,
    updateTask,
} from "../api";
import type { Task } from "../types";
import { Icon } from "../components/Icon";
import { useApp } from "../context/AppContext";

export function TasksPage() {
    const { user, tasks, setTasks, groups, users } = useApp();
    const [showCreate, setShowCreate] = useState(false);
    const [filterGroup, setFilterGroup] = useState("all");
    const [newTask, setNewTask] = useState({ title: "", description: "", assigneeId: "", groupId: "", priority: "medium", dueDate: "" });
    const [editTask, setEditTask] = useState<Task | null>(null);
    const [taskBusy, setTaskBusy] = useState(false);
    const [taskError, setTaskError] = useState("");

    const myGroupIds = groups.filter(g => g.members.includes(user.id) || g.leaderId === user.id).map(g => g.id);
    const visibleGroupIds = user.role === "student" ? myGroupIds : groups.map(g => g.id);
    const visibleTasks = tasks.filter(t => visibleGroupIds.includes(t.groupId) && (filterGroup === "all" || t.groupId === parseInt(filterGroup, 10)));

    const getGroupName = (id: number) => groups.find(g => g.id === id)?.name || "Unknown";
    const getUserName = (id: number) => users.find(u => u.id === id)?.name || "Unknown";

    const isLeader = (task: Task) => {
        const g = groups.find(g => g.id === task.groupId);
        return g?.leaderId === user.id;
    };

    const handleCreateTask = async () => {
        if (!newTask.title || !newTask.groupId) return;
        setTaskBusy(true);
        setTaskError("");
        try {
            const assignee = parseInt(newTask.assigneeId, 10);
            const created = await createTask(user.id, {
                title: newTask.title,
                description: newTask.description,
                groupId: parseInt(newTask.groupId, 10),
                assigneeId: Number.isNaN(assignee) ? user.id : assignee,
                priority: newTask.priority,
                dueDate: newTask.dueDate,
            });
            setTasks(ts => [...ts, created]);
            setShowCreate(false);
            setNewTask({ title: "", description: "", assigneeId: "", groupId: "", priority: "medium", dueDate: "" });
        } catch (e) {
            setTaskError(e instanceof Error ? e.message : "Failed to create task.");
        } finally {
            setTaskBusy(false);
        }
    };

    const handleStatusChange = async (tid: number, status: Task["status"]) => {
        setTaskError("");
        try {
            const updated = await updateTask(user.id, tid, { status });
            setTasks(ts => ts.map(t => t.id === tid ? updated : t));
        } catch (e) {
            setTaskError(e instanceof Error ? e.message : "Failed to update task status.");
        }
    };

    const handleDeleteTask = async (tid: number) => {
        setTaskBusy(true);
        setTaskError("");
        try {
            await deleteTask(user.id, tid);
            setTasks(ts => ts.filter(t => t.id !== tid));
        } catch (e) {
            setTaskError(e instanceof Error ? e.message : "Failed to delete task.");
        } finally {
            setTaskBusy(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!editTask) return;
        setTaskBusy(true);
        setTaskError("");
        try {
            const updated = await updateTask(user.id, editTask.id, {
                title: editTask.title,
                description: editTask.description,
                priority: editTask.priority,
                dueDate: editTask.dueDate,
                assigneeId: editTask.assigneeId,
                status: editTask.status,
            });
            setTasks(ts => ts.map(t => t.id === updated.id ? updated : t));
            setEditTask(null);
        } catch (e) {
            setTaskError(e instanceof Error ? e.message : "Failed to update task.");
        } finally {
            setTaskBusy(false);
        }
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

            {taskError && <div className="error-msg" style={{ marginBottom: 12 }}>{taskError}</div>}

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
                                                <button className="btn btn-danger btn-sm" style={{ padding: "3px 7px" }} onClick={() => void handleDeleteTask(task.id)} disabled={taskBusy}>
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
                        {taskError && <div className="error-msg" style={{ marginBottom: 10 }}>{taskError}</div>}
                        <div className="modal-actions">
                            <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={() => void handleCreateTask()} disabled={taskBusy}>{taskBusy ? "Creating..." : "Create Task"}</button>
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
