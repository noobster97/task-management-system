import {
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock3,
  Columns3,
  LayoutList,
  LogOut,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { apiRequest } from "../services/api.js";

const statuses = [
  { value: "pending", label: "Pending", Icon: CircleDot },
  { value: "in_progress", label: "In Progress", Icon: Clock3 },
  { value: "completed", label: "Completed", Icon: CheckCircle2 },
];

const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const statusByValue = Object.fromEntries(statuses.map((status) => [status.value, status]));

function isOverdue(task) {
  if (!task.due_date || task.status === "completed") {
    return false;
  }
  return new Date(`${task.due_date}T23:59:59`) < new Date();
}

export default function Dashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    due_date: "",
    user_id: user.id,
  });
  const [drafts, setDrafts] = useState({});
  const [filters, setFilters] = useState({ search: "", status: "all", priority: "all", owner: "all" });
  const [view, setView] = useState("board");
  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const counts = useMemo(() => {
    const totals = statuses.reduce((acc, status) => {
      acc[status.value] = tasks.filter((task) => task.status === status.value).length;
      return acc;
    }, {});
    totals.all = tasks.length;
    totals.overdue = tasks.filter(isOverdue).length;
    return totals;
  }, [tasks]);

  function showToast(message, type = "success") {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 2600);
  }

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
        priority: task.priority,
        due_date: task.due_date,
        user_id: task.user_id,
      };
    });
    setDrafts(nextDrafts);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesStatus = filters.status === "all" || task.status === filters.status;
      const matchesPriority = filters.priority === "all" || task.priority === filters.priority;
      const matchesOwner = filters.owner === "all" || task.user_id === Number(filters.owner);
      const matchesSearch = !search
        || task.title.toLowerCase().includes(search)
        || task.description.toLowerCase().includes(search)
        || (task.owner_email || "").toLowerCase().includes(search);
      return matchesStatus && matchesPriority && matchesOwner && matchesSearch;
    });
  }, [filters, tasks]);

  const tasksByStatus = useMemo(() => {
    return statuses.reduce((acc, status) => {
      acc[status.value] = filteredTasks.filter((task) => task.status === status.value);
      return acc;
    }, {});
  }, [filteredTasks]);

  async function addTask(event) {
    event.preventDefault();
    setError("");
    try {
      const task = await apiRequest("/tasks", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setTasks([task, ...tasks]);
      setForm({ title: "", description: "", status: "pending", priority: "medium", due_date: "", user_id: user.id });
      showToast("Task created");
    } catch (err) {
      setError(err.message);
      showToast(err.message, "error");
    }
  }

  function updateDraft(taskId, changes) {
    setDrafts({
      ...drafts,
      [taskId]: { ...drafts[taskId], ...changes },
    });
  }

  async function updateTask(taskId, changes, message = "Task updated") {
    setError("");
    try {
      const updated = await apiRequest(`/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify(changes),
      });
      setTasks(tasks.map((task) => (task.id === taskId ? updated : task)));
      showToast(message);
    } catch (err) {
      setError(err.message);
      showToast(err.message, "error");
    }
  }

  async function deleteTask() {
    if (!deleteTarget) {
      return;
    }
    setError("");
    try {
      await apiRequest(`/tasks/${deleteTarget.id}`, { method: "DELETE" });
      setTasks(tasks.filter((task) => task.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast("Task deleted");
    } catch (err) {
      setError(err.message);
      showToast(err.message, "error");
    }
  }

  function renderTaskCard(task, compact = false) {
    const draft = drafts[task.id] || task;
    const status = statusByValue[draft.status] || statuses[0];
    const StatusIcon = status.Icon;
    const dirty = draft.title !== task.title
      || draft.description !== task.description
      || draft.status !== task.status
      || draft.priority !== task.priority
      || draft.due_date !== task.due_date
      || draft.user_id !== task.user_id;

    return (
      <article className={`task-card ${compact ? "compact" : ""}`} key={task.id}>
        <div className="task-meta">
          <span className={`status-pill ${draft.status}`}>
            <StatusIcon size={14} /> {status.label}
          </span>
          <span className={`priority-pill ${draft.priority}`}>{draft.priority}</span>
        </div>
        <div className="task-card-header">
          <input value={draft.title} onChange={(e) => updateDraft(task.id, { title: e.target.value })} />
          <button className="icon-button danger" onClick={() => setDeleteTarget(task)} aria-label="Delete task" title="Delete task">
            <Trash2 size={18} />
          </button>
        </div>
        <textarea rows={compact ? "2" : "3"} value={draft.description} onChange={(e) => updateDraft(task.id, { description: e.target.value })} />
        <div className="task-details">
          {draft.due_date ? (
            <span className={isOverdue({ ...task, ...draft }) ? "due overdue" : "due"}>
              <CalendarDays size={14} /> {draft.due_date}
            </span>
          ) : (
            <span className="due muted"><CalendarDays size={14} /> No due date</span>
          )}
          {user.role === "admin" && <span className="owner-label">{task.owner_email}</span>}
        </div>
        <div className="task-footer">
          <select value={draft.status} onChange={(e) => updateDraft(task.id, { status: e.target.value })}>
            {statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <select value={draft.priority} onChange={(e) => updateDraft(task.id, { priority: e.target.value })}>
            {priorities.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <input type="date" value={draft.due_date || ""} onChange={(e) => updateDraft(task.id, { due_date: e.target.value })} />
          {user.role === "admin" && (
            <select value={draft.user_id} onChange={(e) => updateDraft(task.id, { user_id: Number(e.target.value) })}>
              {users.map((owner) => <option key={owner.id} value={owner.id}>{owner.email}</option>)}
            </select>
          )}
          <button className="save-button" disabled={!dirty} onClick={() => updateTask(task.id, draft)}>
            <Save size={16} /> Save
          </button>
        </div>
      </article>
    );
  }

  return (
    <main className="dashboard">
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <header className="topbar">
        <div className="topbar-copy">
          <span className="eyebrow">{user.role === "admin" ? "Admin workspace" : "Personal workspace"}</span>
          <h1>Task Command Center</h1>
          <p>{user.role === "admin" ? "Review ownership, progress, due dates, and delivery status across the team." : "Plan, prioritize, and move tasks through a clear board workflow."}</p>
        </div>
        <div className="user-chip">
          <div>
            <span>{user.email}</span>
            <strong>{user.role}</strong>
          </div>
          <button className="icon-button" onClick={onLogout} aria-label="Logout" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <section className="stats">
        {statuses.map((status) => {
          const StatusIcon = status.Icon;
          return (
            <button
              type="button"
              className={`stat ${filters.status === status.value ? "active" : ""}`}
              key={status.value}
              onClick={() => setFilters({ ...filters, status: status.value })}
            >
              <span><StatusIcon size={16} /> {status.label}</span>
              <strong>{counts[status.value] || 0}</strong>
            </button>
          );
        })}
        <button type="button" className={`stat overdue-stat ${counts.overdue ? "warning" : ""}`} onClick={() => setFilters({ ...filters, status: "all" })}>
          <span><CalendarDays size={16} /> Overdue</span>
          <strong>{counts.overdue}</strong>
        </button>
      </section>

      <section className="task-layout">
        <form className="task-form" onSubmit={addTask}>
          <div className="panel-heading">
            <h2>Add Task</h2>
            <span>New item</span>
          </div>
          <label>
            Title
            <input placeholder="e.g. Prepare API documentation" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>
          <label>
            Description
            <textarea placeholder="Add context, acceptance notes, or next steps" rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <div className="form-grid">
            <label>
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
            </label>
            <label>
              Priority
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {priorities.map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}
              </select>
            </label>
          </div>
          <label>
            Due date
            <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
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
                placeholder="Search tasks, notes, or owner"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </label>
            <div className="view-toggle" aria-label="Switch task view">
              <button type="button" className={view === "board" ? "active" : ""} onClick={() => setView("board")} title="Board view">
                <Columns3 size={16} /> Board
              </button>
              <button type="button" className={view === "list" ? "active" : ""} onClick={() => setView("list")} title="List view">
                <LayoutList size={16} /> List
              </button>
            </div>
            <div className="filter-row">
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="all">All statuses</option>
                {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
              <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
                <option value="all">All priorities</option>
                {priorities.map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}
              </select>
              {user.role === "admin" && (
                <select value={filters.owner} onChange={(e) => setFilters({ ...filters, owner: e.target.value })}>
                  <option value="all">All owners</option>
                  {users.map((owner) => <option key={owner.id} value={owner.id}>{owner.email}</option>)}
                </select>
              )}
            </div>
          </div>

          {error && <div className="error">{error}</div>}
          {loading && <div className="empty">Loading tasks...</div>}
          {!loading && tasks.length === 0 && <div className="empty">No tasks yet.</div>}
          {!loading && tasks.length > 0 && filteredTasks.length === 0 && <div className="empty">No matching tasks.</div>}

          {!loading && filteredTasks.length > 0 && view === "board" && (
            <section className="kanban-board">
              {statuses.map((status) => {
                const StatusIcon = status.Icon;
                return (
                  <div className="kanban-column" key={status.value}>
                    <div className="kanban-heading">
                      <span><StatusIcon size={16} /> {status.label}</span>
                      <strong>{tasksByStatus[status.value]?.length || 0}</strong>
                    </div>
                    <div className="kanban-stack">
                      {(tasksByStatus[status.value] || []).map((task) => renderTaskCard(task, true))}
                      {(tasksByStatus[status.value] || []).length === 0 && <div className="column-empty">No tasks</div>}
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {!loading && filteredTasks.length > 0 && view === "list" && (
            <section className="list-stack">
              {filteredTasks.map((task) => renderTaskCard(task))}
            </section>
          )}
        </section>
      </section>

      {deleteTarget && (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">
            <button className="icon-button modal-close" onClick={() => setDeleteTarget(null)} aria-label="Close">
              <X size={18} />
            </button>
            <h2 id="delete-title">Delete task?</h2>
            <p>{deleteTarget.title}</p>
            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="danger-button" onClick={deleteTask}>Delete</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
