import { createContext, useContext } from "react";

export type Session = { username: string; csrfToken: string };
type AdminState = { session: Session | null; loading: boolean; error: string; login: (username: string, password: string) => Promise<void>; logout: () => Promise<void> };
export const AdminContext = createContext<AdminState | null>(null);

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error("AdminProvider is required");
  return context;
}
