import { useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { projectCategories } from "../../data/projectCategories";
import { useProjects } from "../../context/useProjects";
import { useAdmin } from "../../context/useAdmin";
import ProjectGallery from "./ProjectGallery";
import "./SiteInfoPage.css";
import "../Projects/Projects.css";

const policyTitles: Record<string, string> = {
  "/terms": "이용약관",
  "/email-policy": "이메일무단수집거부",
  "/privacy": "개인정보처리방침",
};

export function ProjectsPage() {
  const { projects, loading, error } = useProjects();
  const { session } = useAdmin();
  const { projectCategory } = useParams();
  const activeCategory = projectCategories.find((category) => category.slug === (projectCategory ?? ""))?.category ?? "전체";
  const filteredProjects = activeCategory === "전체" ? projects : projects.filter((project) => project.category === activeCategory);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const previousTitle = document.title;
    document.title = "시공 사례 | 연솔루션";
    return () => { document.title = previousTitle; };
  }, [projectCategory]);
  return <section className="project-showcase section-container" id="projects" aria-labelledby="projects-title">
    <div className="project-showcase-heading"><p>OUR PROJECTS</p><h1 id="projects-title">시공 사례</h1></div>
    {session && <div className="project-admin-actions"><Link to="/admin">게시글 관리</Link><Link to="/admin/projects/new">시공사례 글쓰기 +</Link></div>}
    <nav className="project-tabs" aria-label="시공사례 분류">
      {projectCategories.map((category) => (
        <Link
          key={category.slug}
          to={category.slug ? `/projects/${category.slug}` : "/projects"}
          aria-current={activeCategory === category.category ? "page" : undefined}
        >{category.name}</Link>
      ))}
    </nav>
    {loading ? <p className="project-empty" role="status">시공사례를 불러오고 있습니다.</p> : error && !projects.length ? <p className="project-empty" role="status">시공사례를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</p> : <ProjectGallery key={projectCategory ?? "all"} projects={filteredProjects} />}
  </section>;
}

export default function SiteInfoPage() {
  const { pathname } = useLocation();
  const isSupport = pathname === "/support";
  const policy = policyTitles[pathname];
  const title = isSupport ? "고객 지원" : policy ?? "페이지를 찾을 수 없습니다";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const previousTitle = document.title;
    document.title = `${title} | 연솔루션`;
    return () => { document.title = previousTitle; };
  }, [title]);

  return <article className="site-info-page">
    <nav aria-label="현재 위치"><Link to="/">홈</Link><span aria-hidden="true">›</span><strong>{title}</strong></nav>
    <header><p>{isSupport ? "CONTACT YEON SOLUTION" : "YEON SOLUTION"}</p><h1>{title}</h1></header>
    {isSupport ? <>
      <p className="site-info-description">제품 선정부터 설계·시공·유지관리까지, 연솔루션으로 문의해 주세요.</p>
      <div className="site-contact-options">
        <a href="tel:0312335559"><span>전화 상담</span><strong>031-233-5559</strong><b aria-hidden="true">↗</b></a>
        <a href="mailto:cy6907@naver.com"><span>이메일 문의</span><strong>cy6907@naver.com</strong><b aria-hidden="true">↗</b></a>
      </div>
      <div className="site-contact-hours"><h2>상담 시간</h2><p>평일 09:00–18:00 · 점심시간 12:00–13:00<br />토요일·일요일·공휴일 휴무</p><Link to="/company/location">오시는 길 <span aria-hidden="true">→</span></Link></div>
    </> : <div className="site-info-notice">
      <h2>{policy ? "안내 문서를 준비하고 있습니다." : "요청한 주소를 확인해 주세요."}</h2>
      <p>{policy ? "관련 문의는 연솔루션 대표전화 또는 이메일로 연락해 주세요." : "메인 페이지 또는 상단 메뉴에서 원하는 정보를 찾을 수 있습니다."}</p>
      <div><Link to="/">메인으로 이동</Link><Link to="/support">문의 안내</Link></div>
    </div>}
  </article>;
}
