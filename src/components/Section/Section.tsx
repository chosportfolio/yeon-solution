import { Route, Routes } from "react-router-dom";
import MainSection from "./MainSection";
import "./Section.css";

export default function Section() {
  return (
    <main className="section">
      <Routes>
        <Route path="/" element={<MainSection />} />
      </Routes>
    </main>
  );
}
