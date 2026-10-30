import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Project } from "../data/projects";
import { getProjects } from "../lib/projectsApi";
import { ProjectsContext } from "./useProjects";

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(() => getProjects()
    .then(data => { setProjects(data.projects); setError(""); })
    .catch(cause => { setError(cause instanceof Error ? cause.message : "게시글을 불러오지 못했습니다."); })
    .finally(() => { setLoading(false); }), []);
  useEffect(() => {
    void refresh();
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    const interval = window.setInterval(onFocus, 30_000);
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("yeon-projects") : null;
    if (channel) channel.onmessage = onFocus;
    return () => { window.removeEventListener("focus", onFocus); clearInterval(interval); channel?.close(); };
  }, [refresh]);
  const changed = useCallback(async () => {
    await refresh();
    if (typeof BroadcastChannel !== "undefined") { const channel = new BroadcastChannel("yeon-projects"); channel.postMessage("updated"); channel.close(); }
  }, [refresh]);
  return <ProjectsContext.Provider value={{ projects, loading, error, refresh, changed }}>{children}</ProjectsContext.Provider>;
}
