import type { ProjectBlock } from "../../data/projects";
import "./Projects.css";

export default function ProjectBody({ blocks }: { blocks: ProjectBlock[] }) {
  return <div className="project-post-body">
    {blocks.map(block => block.type === "image" ? (
      <figure key={block.id}><img src={block.image} alt={block.caption || "시공 현장 사진"} loading="lazy" />{block.caption && <figcaption>{block.caption}</figcaption>}</figure>
    ) : (
      <div key={block.id} className={`project-text project-text--${block.style}${block.bold ? " is-bold" : ""}`} style={{ textAlign: block.align }}>
        {block.style === "heading" ? <h2>{block.text}</h2> : block.style === "quote" ? <blockquote>{block.text}</blockquote> : <p>{block.text}</p>}
      </div>
    ))}
  </div>;
}
