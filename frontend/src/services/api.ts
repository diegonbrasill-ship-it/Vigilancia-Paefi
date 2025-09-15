// frontend/src/services/api.ts
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function login(username: string, password: string) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    credentials: "include", // ESSENCIAL para cookie httpOnly
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Credenciais inválidas" }));
    throw new Error(err.message || "Erro ao autenticar");
  }

  return res.json(); // retorna { user: { ... } }
}

export async function me() {
  const res = await fetch(`${API}/auth/me`, { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}

export async function logout() {
  await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
}



