import type { MouseEvent } from "react";
import "./HeroScrollCue.css";

// The cue belongs to the hero shell, never to a slide or its image.
export default function HeroScrollCue() {
  const scrollToContent = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const content = document.getElementById("home-content");
    if (!content) return;
    event.preventDefault();
    content.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <a className="home-hero-scroll" href="#home-content" aria-label="사업 분야로 이동" onClick={scrollToContent}>
      <span>SCROLL</span>
      <span aria-hidden="true">↓</span>
    </a>
  );
}
