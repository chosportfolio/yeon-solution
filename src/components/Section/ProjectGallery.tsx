import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { Project } from "../../data/projects";

const PROJECTS_PER_PAGE = 30;

export default function ProjectGallery({ projects }: { projects: Project[] }) {
  const [searchParams] = useSearchParams();
  const requestedPage = Number(searchParams.get("page") ?? 1);
  const totalPages = Math.max(1, Math.ceil(projects.length / PROJECTS_PER_PAGE));
  const currentPage = Number.isSafeInteger(requestedPage) && requestedPage > 0
    ? Math.min(requestedPage, totalPages)
    : 1;
  const visibleProjects = projects.slice((currentPage - 1) * PROJECTS_PER_PAGE, currentPage * PROJECTS_PER_PAGE);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [currentPage]);

  const pageLink = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page === 1) params.delete("page");
    else params.set("page", String(page));
    return { search: params.toString() };
  };

  return <>
    <p className="project-list-count" role="status">총 <strong>{projects.length}</strong>건</p>
    {visibleProjects.length > 0 ? (
      <div className="project-grid">
        {visibleProjects.map((project) => (
          <article className="project-card" key={project.name}>
            <div className="project-list-image">
              <img src={project.image} alt={`${project.name} 시공 현장`} loading="lazy" />
            </div>
            <div className="project-card-text"><p>{project.category}</p><h3>{project.name}</h3></div>
          </article>
        ))}
      </div>
    ) : <p className="project-empty">등록된 시공사례가 없습니다.</p>}
    <nav className="project-pagination" aria-label="시공사례 페이지">
      {currentPage > 1
        ? <Link className="project-page-step" to={pageLink(currentPage - 1)} aria-label="이전 페이지">‹</Link>
        : <span className="project-page-step" aria-disabled="true" aria-label="이전 페이지">‹</span>}
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
        <Link key={page} to={pageLink(page)} aria-label={`${page}페이지`} aria-current={currentPage === page ? "page" : undefined}>{page}</Link>
      ))}
      {currentPage < totalPages
        ? <Link className="project-page-step" to={pageLink(currentPage + 1)} aria-label="다음 페이지">›</Link>
        : <span className="project-page-step" aria-disabled="true" aria-label="다음 페이지">›</span>}
    </nav>
  </>;
}
