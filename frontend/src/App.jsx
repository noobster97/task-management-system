import { useEffect, useState } from "react";

import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import { clearSession, getCurrentUser, getToken } from "./services/api.js";

export default function App() {
  const [user, setUser] = useState(getToken() ? getCurrentUser() : null);
  const [view, setView] = useState(user ? "dashboard" : "login");

  useEffect(() => {
    function handleExpiredSession() {
      setUser(null);
      setView("login");
    }
    window.addEventListener("auth-expired", handleExpiredSession);
    return () => window.removeEventListener("auth-expired", handleExpiredSession);
  }, []);

  function handleAuthenticated(nextUser) {
    setUser(nextUser);
    setView("dashboard");
  }

  function handleLogout() {
    clearSession();
    setUser(null);
    setView("login");
  }

  if (user && view === "dashboard") {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  if (view === "register") {
    return <Register onAuthenticated={handleAuthenticated} onNavigateLogin={() => setView("login")} />;
  }

  return <Login onAuthenticated={handleAuthenticated} onNavigateRegister={() => setView("register")} />;
}
