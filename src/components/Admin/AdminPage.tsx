import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAdmin } from "../../context/useAdmin";
import { useProjects } from "../../context/useProjects";
import { projectCategories } from "../../data/projectCategories";
import type { ImageBlock, Project, ProjectBlock, ProjectInput, TextBlock } from "../../data/projects";
import { api, uploadPhoto } from "../../lib/projectsApi";
import ProjectBody from "../Projects/ProjectBody";
import "./AdminPage.css";

const textBlock = (style: TextBlock["style"] = "body"): TextBlock => ({ id: crypto.randomUUID(), type: "text", text: "", style, align: "left", bold: false });

function Login() {
  const { login, error: connectionError } = useAdmin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <div className="admin-login-wrap"><section className="admin-login">
    <p className="cms-eyebrow">YEON SOLUTION ADMIN</p><h1>관리자 로그인</h1><p className="admin-login-description">시공사례를 작성하고 관리하는 공간입니다.</p>
    <form onSubmit={async event => { event.preventDefault(); setBusy(true); setError(""); try { await login(username, password); setPassword(""); } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); } }}>
      <label>아이디<input name="username" autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} required maxLength={80} /></label>
      <label>비밀번호<input name="password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required maxLength={256} /></label>
      {(error || connectionError) && <p className="cms-error" role="alert">{error || connectionError}</p>}
      <button className="cms-button cms-button--primary" disabled={busy}>{busy ? "로그인 중…" : "로그인"}</button>
    </form>
    <Link className="cms-back-link" to="/">홈페이지로 돌아가기 →</Link>
  </section></div>;
}

function Dashboard() {
  const { projects, loading, error: connectionError, changed } = useProjects();
  const { session, logout } = useAdmin();
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return <section className="admin-page">
    <div className="admin-page-heading"><div><p className="cms-eyebrow">CONTENT MANAGEMENT</p><h1>시공사례 관리</h1><p>한 번 등록한 글이 메인과 시공사례에 함께 표시됩니다.</p></div><div className="cms-actions"><button className="cms-button" onClick={() => { void logout().catch(cause => setError(cause.message)); }}>로그아웃</button><Link className="cms-button cms-button--primary" to="/admin/projects/new">새 글 작성 +</Link></div></div>
    {(error || connectionError) && <p className="cms-error" role="alert">{error || connectionError}</p>}
    <div className="admin-list-heading"><strong>등록된 시공사례 <span>{projects.length}</span></strong><Link to="/projects">시공사례 페이지 보기 ↗</Link></div>
    {loading ? <p role="status">불러오는 중입니다.</p> : <div className="admin-post-list">
      {projects.map(project => <article className="admin-post-row" key={project.id}>
        <Link to={`/projects/view/${project.id}`}><img src={project.image} alt="" loading="lazy" /></Link>
        <div className="admin-post-info"><p>{projectCategories.find(category => category.category === project.category)?.name}</p><Link to={`/projects/view/${project.id}`}><h2>{project.name}</h2></Link><small>{project.createdAt ? new Date(project.createdAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }) : "기존 시공사례"}</small></div>
        <div className="cms-actions"><Link className="cms-button" to={`/admin/projects/${project.id}/edit`}>수정</Link><button className="cms-button cms-button--muted" onClick={() => setDeleting(project.id)}>삭제</button></div>
      </article>)}
      {!projects.length && <p className="project-empty">첫 시공사례를 작성해 보세요.</p>}
    </div>}
    {deleting && <div className="cms-dialog-backdrop"><div className="cms-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title"><h2 id="delete-title">이 게시글을 삭제할까요?</h2><p>메인과 시공사례 목록에서 함께 삭제됩니다.</p><div className="cms-actions"><button className="cms-button" autoFocus disabled={busy} onClick={() => setDeleting(null)}>취소</button><button className="cms-button cms-button--primary" disabled={busy} onClick={async () => { setBusy(true); setError(""); try { await api(`/projects/${deleting}`, { method: "DELETE" }, session!.csrfToken); await changed(); setDeleting(null); } catch (cause) { setError((cause as Error).message); setDeleting(null); } finally { setBusy(false); } }}>{busy ? "삭제 중…" : "삭제"}</button></div></div></div>}
  </section>;
}

function ProjectEditor({ project }: { project?: Project }) {
  const { session } = useAdmin();
  const { changed } = useProjects();
  const navigate = useNavigate();
  const draftKey = `yeon-project-draft:${project?.id ?? "new"}`;
  const [draft, setDraft] = useState<ProjectInput>(() => {
    try {
      const saved = sessionStorage.getItem(draftKey);
      if (saved) { const parsed = JSON.parse(saved); if (typeof parsed.name === "string" && Array.isArray(parsed.blocks) && parsed.blocks.length <= 100) return parsed; }
    } catch { /* Storage may be disabled. */ }
    return project ? { name: project.name, category: project.category, image: project.image, blocks: project.blocks } : { name: "", category: "냉난방기", image: "", blocks: [textBlock()] };
  });
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");
  const imageInput = useRef<HTMLInputElement>(null);
  const photos = draft.blocks.filter((block): block is ImageBlock => block.type === "image");
  const update = (value: Partial<ProjectInput>) => { setDraft(previous => ({ ...previous, ...value })); setDirty(true); };
  const patchBlock = (id: string, patch: Partial<TextBlock> | Partial<ImageBlock>) => update({ blocks: draft.blocks.map(block => block.id === id ? { ...block, ...patch } as ProjectBlock : block) });
  useEffect(() => {
    if (!dirty) return;
    try { sessionStorage.setItem(draftKey, JSON.stringify(draft)); } catch { /* Publishing still works without draft storage. */ }
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [draft, dirty, draftKey]);
  const move = (index: number, direction: number) => {
    const blocks = [...draft.blocks];
    const other = index + direction;
    if (other < 0 || other >= blocks.length) return;
    [blocks[index], blocks[other]] = [blocks[other], blocks[index]];
    update({ blocks });
  };
  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true); setError("");
    try {
      if (draft.blocks.length + files.length > 100) throw new Error("문단과 사진은 최대 100개까지 추가할 수 있습니다.");
      const added: ImageBlock[] = [];
      for (const file of Array.from(files)) { const uploaded = await uploadPhoto(file, session!.csrfToken); added.push({ id: crypto.randomUUID(), type: "image", image: uploaded.image, caption: "" }); }
      setDraft(previous => ({ ...previous, blocks: [...previous.blocks, ...added], image: previous.image || added[0].image }));
      setDirty(true);
    } catch (cause) { setError((cause as Error).message); }
    finally { setUploading(false); if (imageInput.current) imageInput.current.value = ""; }
  }
  async function publish() {
    setError("");
    if (!draft.name.trim()) { setError("제목을 입력해 주세요."); return; }
    if (!draft.image) { setError("사진을 추가하고 대표 사진을 선택해 주세요."); return; }
    if (!draft.blocks.some(block => block.type === "image" || block.text.trim())) { setError("본문을 작성해 주세요."); return; }
    setBusy(true);
    try {
      const result = await api<{ project: Project }>(project ? `/projects/${project.id}` : "/projects", { method: project ? "PUT" : "POST", body: JSON.stringify(draft) }, session!.csrfToken);
      try { sessionStorage.removeItem(draftKey); } catch { /* Publishing does not depend on browser storage. */ }
      setDirty(false); await changed();
      navigate(`/projects/view/${result.project.id}`);
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }
  return <section className="admin-page admin-editor">
    <div className="admin-editor-heading"><div><p className="cms-eyebrow">PROJECT STORY</p><h1>{project ? "시공사례 수정" : "새 시공사례 작성"}</h1></div><div className="cms-actions"><button className="cms-button" disabled={busy || uploading} onClick={() => { if (!dirty || window.confirm("작성한 내용은 이 탭에 임시 저장됩니다. 글 목록으로 나갈까요?")) navigate("/admin"); }}>나가기</button><button className="cms-button" aria-pressed={preview} onClick={() => setPreview(!preview)}>{preview ? "편집으로" : "미리보기"}</button><button className="cms-button cms-button--primary" disabled={busy || uploading} onClick={() => { void publish(); }}>{busy ? "저장 중…" : project ? "수정 완료" : "등록하기"}</button></div></div>
    {error && <p className="cms-error" role="alert">{error}</p>}
    <fieldset disabled={busy} className="admin-editor-fields">
    <div className="admin-editor-meta"><label>분류<select aria-label="시공 분류" value={draft.category} onChange={event => update({ category: event.target.value })}>{projectCategories.filter(category => category.slug).map(category => <option key={category.slug} value={category.category}>{category.name}</option>)}</select></label><span>{dirty ? "이 탭에 임시 저장됨" : "사진과 글로 현장의 이야기를 전해 주세요."}</span></div>
    {preview ? <div className="admin-preview"><header className="project-post-heading"><p>{projectCategories.find(category => category.category === draft.category)?.name}</p><h1>{draft.name || "제목을 입력해 주세요"}</h1></header><ProjectBody blocks={draft.blocks} /></div> : <>
      <label className="admin-title-label"><span className="cms-sr-only">게시글 제목</span><input className="admin-title-input" aria-label="게시글 제목" placeholder="제목을 입력해 주세요" value={draft.name} maxLength={120} onChange={event => update({ name: event.target.value })} /></label>
      <div className="admin-editor-toolbar" aria-label="본문 도구"><button type="button" disabled={draft.blocks.length >= 100} onClick={() => update({ blocks: [...draft.blocks, textBlock()] })}>본문 +</button><button type="button" disabled={draft.blocks.length >= 100} onClick={() => update({ blocks: [...draft.blocks, textBlock("heading")] })}>소제목 +</button><button type="button" disabled={draft.blocks.length >= 100} onClick={() => update({ blocks: [...draft.blocks, textBlock("quote")] })}>인용문 +</button><button type="button" disabled={uploading} onClick={() => imageInput.current?.click()}>{uploading ? "사진 업로드 중…" : "사진 추가 +"}</button><input ref={imageInput} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" aria-label="본문 사진 선택" hidden onChange={event => { void addPhotos(event.currentTarget.files); }} /></div>
      <div className="admin-editor-blocks">
        {draft.blocks.map((block, index) => <section className={`admin-block admin-block--${block.type}`} key={block.id} aria-label={`${index + 1}번째 ${block.type === "image" ? "사진" : "문단"}`}>
          <div className="admin-block-controls"><span>{block.type === "image" ? "사진" : "문단"} {index + 1}</span><div>
            {block.type === "text" && <><select aria-label={`${index + 1}번째 문단 스타일`} value={block.style} onChange={event => patchBlock(block.id, { style: event.target.value as TextBlock["style"] })}><option value="body">본문</option><option value="heading">소제목</option><option value="quote">인용문</option></select><button type="button" aria-label={`${index + 1}번째 문단 굵게`} aria-pressed={block.bold} onClick={() => patchBlock(block.id, { bold: !block.bold })}><b>B</b></button><button type="button" aria-label={`${index + 1}번째 문단 가운데 정렬`} aria-pressed={block.align === "center"} onClick={() => patchBlock(block.id, { align: block.align === "center" ? "left" : "center" })}>가운데</button></>}
            <button type="button" aria-label={`${index + 1}번째 블록 위로`} disabled={index === 0} onClick={() => move(index, -1)}>↑</button><button type="button" aria-label={`${index + 1}번째 블록 아래로`} disabled={index === draft.blocks.length - 1} onClick={() => move(index, 1)}>↓</button><button type="button" aria-label={`${index + 1}번째 블록 삭제`} onClick={() => { const blocks = draft.blocks.filter(item => item.id !== block.id); update({ blocks, image: block.type === "image" && draft.image === block.image ? blocks.find((item): item is ImageBlock => item.type === "image")?.image ?? "" : draft.image }); }}>삭제</button>
          </div></div>
          {block.type === "text" ? <textarea className={`admin-block-text admin-block-text--${block.style}`} aria-label={`${index + 1}번째 문단 내용`} placeholder={block.style === "heading" ? "소제목을 입력해 주세요" : block.style === "quote" ? "인용문을 입력해 주세요" : "시공 현장의 이야기를 자유롭게 작성해 주세요."} value={block.text} maxLength={20000} style={{ textAlign: block.align, fontWeight: block.bold ? 700 : undefined }} onChange={event => patchBlock(block.id, { text: event.target.value })} /> : <><img className="admin-block-photo" src={block.image} alt={block.caption || "본문 사진"} /><input className="admin-photo-caption" aria-label={`${index + 1}번째 사진 설명`} placeholder="사진 설명을 입력해 주세요 (선택)" value={block.caption} maxLength={300} onChange={event => patchBlock(block.id, { caption: event.target.value })} /><button className="admin-cover-toggle" type="button" aria-pressed={draft.image === block.image} onClick={() => update({ image: block.image })}>{draft.image === block.image ? "✓ 대표 사진" : "대표 사진으로 선택"}</button></>}
        </section>)}
        {!draft.blocks.length && <p className="project-empty">본문 도구에서 글이나 사진을 추가해 주세요.</p>}
      </div>
      {photos.length > 0 && <div className="admin-cover-summary"><strong>대표 사진</strong><img src={draft.image} alt="선택한 대표 사진" /><span>목록과 메인에 표시되는 사진입니다.</span></div>}
      <p className="admin-editor-note">사진은 장당 10MB까지 추가할 수 있습니다. 등록한 글은 메인과 시공사례에 함께 반영됩니다.</p>
    </>}
    </fieldset>
  </section>;
}

export default function AdminPage() {
  const { session, loading } = useAdmin();
  const { projects, loading: projectsLoading } = useProjects();
  const { pathname } = useLocation();
  const { projectId } = useParams();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); const previous = document.title; document.title = "시공사례 관리 | 연솔루션"; return () => { document.title = previous; }; }, [pathname]);
  if (loading) return <p className="section-loading" role="status">관리자 정보를 확인하고 있습니다.</p>;
  if (!session) return <Login />;
  if (pathname === "/admin") return <Dashboard />;
  if (pathname.endsWith("/new")) return <ProjectEditor key="new" />;
  const project = projects.find(item => item.id === projectId);
  if (projectsLoading) return <p className="section-loading" role="status">게시글을 불러오고 있습니다.</p>;
  return project ? <ProjectEditor key={project.id} project={project} /> : <section className="admin-page"><h1>게시글을 찾을 수 없습니다.</h1><Link className="cms-button" to="/admin">관리 화면으로</Link></section>;
}
