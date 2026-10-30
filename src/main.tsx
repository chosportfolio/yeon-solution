import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { ProjectsProvider } from "./context/ProjectsContext";
import { AdminProvider } from "./context/AdminContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ProjectsProvider><AdminProvider><App /></AdminProvider></ProjectsProvider>
    </BrowserRouter>
  </StrictMode>
);
