const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export function getToken() {
  return sessionStorage.getItem("access_token");
}

export function setSession({ access_token, user }) {
  sessionStorage.setItem("access_token", access_token);
  sessionStorage.setItem("user", JSON.stringify(user));
}

export function getCurrentUser() {
  const rawUser = sessionStorage.getItem("user");
  return rawUser ? JSON.parse(rawUser) : null;
}

export function clearSession() {
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("user");
}

export async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (response.status === 401 || response.status === 422) {
    clearSession();
    window.dispatchEvent(new Event("auth-expired"));
  }

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}
