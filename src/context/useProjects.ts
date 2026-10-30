import { createContext, useContext } from "react";
import type { Project } from "../data/projects";

type ProjectsState = { projects: Project[]; loading: boolean; error: string; refresh: () => Promise<void>; changed: () => Promise<void> };
export const ProjectsContext = createContext<ProjectsState | null>(null);

// Shared by the homepage, project listing, detail page and administrator.
export function useProjects() {
  const context = useContext(ProjectsContext);
  if (!context) throw new Error("ProjectsProvider is required");
  return context;
}
