import { LogOut, Plus, Save, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { apiRequest } from "../services/api.js";

const statuses = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export default function Dashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", status: "pending", user_id: user.id });
  const [drafts, setDrafts] = useState({});
  const [filters, setFilters] = useState({ search: "", status: "all" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const counts = useMemo(() => {
    return statuses.reduce((acc, status) => {
      acc[status.value] = tasks.filter((task) => task.status === status.value).length;
      return acc;
    }, {});
  }, [tasks]);

  async function loadTasks() {
    setLoading(true);
    setError("");
    try {
      setTasks(await apiRequest("/tasks"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    if (user.role !== "admin") {
      return;
    }
    try {
      setUsers(await apiRequest("/users"));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadTasks();
    loadUsers();
  }, []);

  useEffect(() => {
    const nextDrafts = {};
    tasks.forEach((task) => {
      nextDrafts[task.id] = {
        title: task.title,
        description: task.description,
        status: task.status,
        user_id: task.user_id,
      };
    });
    setDrafts(nextDrafts);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesStatus = filters.status === "all" || task.status === filters.status;
      const matchesSearch = !search
        || task.title.toLowerCase().includes(search)
        || task.description.toLowerCase().includes(search)
        || (task.owner_email || "").toLowerCase().includes(search);
      return matchesStatus && matchesSearch;
    });
  }, [filters, tasks]);

  async function addTask(event) {
    event.preventDefault();
    setError("");
    try {
      const task = await apiRequest("/tasks", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setTasks([task, ...tasks]);
      setForm({ title: "", description: "", status: "pending", user_id: user.id });
    } catch (err) {
      setError(err.message);
    }
  }

  function updateDraft(taskId, changes) {
    setDrafts({
      ...drafts,
      [taskId]: { ...drafts[taskId], ...changes },
    });
  }

  async function updateTask(taskId, changes) {
    setError("");
    try {
      const updated = await apiRequest(`/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify(changes),
      });
      setTasks(tasks.map((task) => (task.id === taskId ? updated : task)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteTask(taskId) {
    setError("");
    try {
      await apiRequest(`/tasks/${taskId}`, { method: "DELETE" });
      setTasks(tasks.filter((task) => task.id !== taskId));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="dashboard">
      <header className="topbar">
        <div>
          <h1>Tasks</h1>
          <p>{user.role === "admin" ? "Admin view: all tasks" : "Your personal task list"}</p>
        </div>
        <div className="user-chip">
          <span>{user.email}</span>
          <strong>{user.role}</strong>
          <button className="icon-button" onClick={onLogout} aria-label="Logout" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <section className="stats">
        {statuses.map((status) => (
          <div className="stat" key={status.value}>
            <span>{status.label}</span>
            <strong>{counts[status.value] || 0}</strong>
          </div>
        ))}
      </section>

      <section className="task-layout">
        <form className="task-form" onSubmit={addTask}>
          <h2>Add Task</h2>
          <label>
            Title
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>
          <label>
            Description
            <textarea rows="5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <label>
            Status
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </label>
          {user.role === "admin" && (
            <label>
              Owner
              <select value={form.user_id} onChange={(e) => setForm({ ...form, user_id: Number(e.target.value) })}>
                <option value={user.id}>{user.email}</option>
                {users.filter((owner) => owner.id !== user.id).map((owner) => (
                  <option key={owner.id} value={owner.id}>{owner.email}</option>
                ))}
              </select>
            </label>
          )}
          <button type="submit"><Plus size={17} /> Add task</button>
        </form>

        <section className="task-list">
          <div className="task-toolbar">
            <label className="search-field">
              <Search size={17} />
              <input
                placeholder="Search tasks"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="all">All statuses</option>
              {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </div>
          {error && <div className="error">{error}</div>}
          {loading && <div className="empty">Loading tasks...</div>}
          {!loading && tasks.length === 0 && <div className="empty">No tasks yet.</div>}
          {!loading && tasks.length > 0 && filteredTasks.length === 0 && <div className="empty">No matching tasks.</div>}
          {filteredTasks.map((task) => {
            const draft = drafts[task.id] || task;
            return (
            <article className="task-card" key={task.id}>
              <div className="task-card-header">
                <input value={draft.title} onChange={(e) => updateDraft(task.id, { title: e.target.value })} />
                <button className="icon-button danger" onClick={() => deleteTask(task.id)} aria-label="Delete task" title="Delete task">
                  <Trash2 size={18} />
                </button>
              </div>
              <textarea rows="3" value={draft.description} onChange={(e) => updateDraft(task.id, { description: e.target.value })} />
              <div className="task-footer">
                <select value={draft.status} onChange={(e) => updateDraft(task.id, { status: e.target.value })}>
                  {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                </select>
                {user.role === "admin" && (
                  <select value={draft.user_id} onChange={(e) => updateDraft(task.id, { user_id: Number(e.target.value) })}>
                    {users.map((owner) => <option key={owner.id} value={owner.id}>{owner.email}</option>)}
                  </select>
                )}
                <button className="save-button" onClick={() => updateTask(task.id, draft)}>
                  <Save size={16} /> Save
                </button>
              </div>
              {user.role === "admin" && <span className="owner-label">Owner: {task.owner_email}</span>}
            </article>
            );
          })}
        </section>
      </section>
    </main>
  );
}
