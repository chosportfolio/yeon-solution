import "./TopButton.css";

export default function TopButton() {
  return (
    <button
      type="button"
      className="top-button"
      aria-label="페이지 맨 위로 이동"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <span aria-hidden="true" />
      <small>TOP</small>
    </button>
  );
}
