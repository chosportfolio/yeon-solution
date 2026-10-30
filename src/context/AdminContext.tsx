import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api, ApiError } from "../lib/projectsApi";
import { AdminContext } from "./useAdmin";
import type { Session } from "./useAdmin";

export function AdminProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const expired = () => setSession(null);
    window.addEventListener("yeon-admin-expired", expired);
    const check = () => {
      void api<Session>("/admin/session").then(data => { if (active) { setSession(data); setError(""); } }).catch(cause => {
        if (!active) return;
        if (cause instanceof ApiError && cause.status === 401) setSession(null);
        else setError(cause.message);
      }).finally(() => { if (active) setLoading(false); });
    };
    check();
    window.addEventListener("focus", check);
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("yeon-admin") : null;
    if (channel) channel.onmessage = check;
    return () => { active = false; window.removeEventListener("yeon-admin-expired", expired); window.removeEventListener("focus", check); channel?.close(); };
  }, []);
  const notify = () => { if (typeof BroadcastChannel !== "undefined") { const channel = new BroadcastChannel("yeon-admin"); channel.postMessage("changed"); channel.close(); } };
  const login = async (username: string, password: string) => {
    const data = await api<Session>("/admin/login", { method: "POST", body: JSON.stringify({ username, password }) });
    setSession(data); setError(""); notify();
  };
  const logout = async () => {
    if (session) await api("/admin/logout", { method: "POST" }, session.csrfToken);
    setSession(null);
    try { for (let index = sessionStorage.length - 1; index >= 0; index--) { const key = sessionStorage.key(index); if (key?.startsWith("yeon-project-draft:")) sessionStorage.removeItem(key); } } catch { /* Storage may be disabled. */ }
    notify();
  };
  return <AdminContext.Provider value={{ session, loading, error, login, logout }}>{children}</AdminContext.Provider>;
}
