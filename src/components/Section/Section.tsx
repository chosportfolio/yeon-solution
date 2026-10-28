import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import CompanyPage from "../Company/CompanyPage";
import ProductDetailPage from "../Product/ProductDetailPage";
import MainSection from "./MainSection";
import "./Section.css";

export default function Section() {
  const { pathname } = useLocation();
  return (
    <main className={`section${pathname === "/" ? " section--home" : ""}`}>
      <Routes>
        <Route path="/" element={<MainSection />} />
        <Route path="/company" element={<Navigate to="/company/greeting" replace />} />
        <Route path="/company/:page" element={<CompanyPage />} />
        <Route path="/business/cooling/multi-v-outdoor" element={<ProductDetailPage />} />
        <Route path="/business/cooling/multiv_i" element={<ProductDetailPage />} />
      </Routes>
    </main>
  );
}
