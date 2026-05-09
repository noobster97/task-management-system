import { UserPlus } from "lucide-react";
import { useState } from "react";

import { apiRequest, setSession } from "../services/api.js";

export default function Register({ onAuthenticated, onNavigateLogin }) {
  const [form, setForm] = useState({ email: "", password: "", role: "user" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const loginData = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      setSession(loginData);
      onAuthenticated(loginData.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="brand-mark"><UserPlus size={22} /></div>
        <h1>Create Account</h1>
        <p>Register as a regular user or admin for assessment testing.</p>
        <form onSubmit={submit} className="form">
          <label>
            Email
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </label>
          <label>
            Password
            <input type="password" minLength="6" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </label>
          <label>
            Role
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>{loading ? "Creating..." : "Register"}</button>
        </form>
        <button className="link-button" onClick={onNavigateLogin}>Back to login</button>
      </section>
    </main>
  );
}
