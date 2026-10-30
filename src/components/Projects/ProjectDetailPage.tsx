import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useProjects } from "../../context/useProjects";
import { useAdmin } from "../../context/useAdmin";
import { projectCategories } from "../../data/projectCategories";
import ProjectBody from "./ProjectBody";

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const { projects, loading } = useProjects();
  const { session } = useAdmin();
  const project = projects.find(item => item.id === projectId);
  const category = projectCategories.find(item => item.category === project?.category);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const previous = document.title;
    document.title = `${project?.name ?? "시공사례"} | 연솔루션`;
    return () => { document.title = previous; };
  }, [project?.name, projectId]);
  if (!project) return <section className="project-post"><h1>{loading ? "시공사례를 불러오고 있습니다." : "게시글을 찾을 수 없습니다."}</h1><Link className="cms-button" to="/projects">시공사례 목록</Link></section>;
  return <article className="project-post">
    <nav className="project-post-breadcrumb" aria-label="현재 위치"><Link to="/">홈</Link><span>›</span><Link to="/projects">시공사례</Link><span>›</span><span>{category?.name}</span></nav>
    <header className="project-post-heading"><p>{category?.name}</p><h1>{project.name}</h1><div><span>연솔루션</span>{project.createdAt && <time dateTime={project.createdAt}>{new Date(project.createdAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</time>}</div></header>
    {session && <div className="project-post-edit"><Link className="cms-button" to={`/admin/projects/${project.id}/edit`}>글 수정</Link></div>}
    <ProjectBody blocks={project.blocks} />
    <div className="project-post-bottom"><Link className="cms-button" to={category?.slug ? `/projects/${category.slug}` : "/projects"}>목록으로</Link><Link className="cms-button cms-button--primary" to="/support">시공 문의</Link></div>
  </article>;
}
