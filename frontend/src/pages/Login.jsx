import { LockKeyhole } from "lucide-react";
import { useState } from "react";

import { apiRequest, setSession } from "../services/api.js";

export default function Login({ onAuthenticated, onNavigateRegister }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setSession(data);
      onAuthenticated(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="brand-mark"><LockKeyhole size={22} /></div>
        <h1>Task Management</h1>
        <p>Sign in to manage your assigned tasks.</p>
        <form onSubmit={submit} className="form">
          <label>
            Email
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </label>
          <label>
            Password
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </label>
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Login"}</button>
        </form>
        <button className="link-button" onClick={onNavigateRegister}>Create new account</button>
      </section>
    </main>
  );
}
