import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import CompanyPage from "../Company/CompanyPage";
import MainSection from "./MainSection";
import SiteInfoPage, { ProjectsPage } from "./SiteInfoPage";
import "./Section.css";

const ProductDetailPage = lazy(() => import("../Product/ProductDetailPage"));
const BusinessCategoryPage = lazy(() => import("../Product/BusinessCategoryPage"));
const ProductGroupPage = lazy(() => import("../Product/ProductGroupPage"));

export default function Section() {
  const { pathname } = useLocation();
  return (
    <main className={`section${pathname === "/" ? " section--home" : ""}`}>
      <Suspense fallback={<p className="section-loading" role="status">페이지를 불러오고 있습니다.</p>}>
      <Routes>
        <Route path="/" element={<MainSection />} />
        <Route path="/company" element={<Navigate to="/company/greeting" replace />} />
        <Route path="/company/:page" element={<CompanyPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectCategory" element={<ProjectsPage />} />
        <Route path="/support" element={<SiteInfoPage />} />
        <Route path="/terms" element={<SiteInfoPage />} />
        <Route path="/email-policy" element={<SiteInfoPage />} />
        <Route path="/privacy" element={<SiteInfoPage />} />
        <Route path="/business/cooling/multi-v-outdoor" element={<ProductDetailPage />} />
        <Route path="/business/cooling/multiv_i" element={<ProductDetailPage />} />
        <Route path="/business/:category/:group" element={<ProductGroupPage />} />
        <Route path="/business/:category/:group/:productSlug" element={<ProductDetailPage />} />
        <Route path="/business/:category" element={<BusinessCategoryPage />} />
        <Route path="/business/builtin" element={<Navigate to="/business/appliance" replace />} />
        <Route path="*" element={<SiteInfoPage />} />
      </Routes>
      </Suspense>
    </main>
  );
}
