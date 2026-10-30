import type { Project } from "../data/projects";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

export async function api<T>(path: string, options: RequestInit = {}, csrfToken?: string): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && typeof options.body === "string") headers.set("Content-Type", "application/json");
  if (csrfToken) headers.set("X-CSRF-Token", csrfToken);
  let response: Response;
  try { response = await fetch(`/api${path}`, { ...options, headers, credentials: "same-origin", cache: "no-store" }); }
  catch { throw new ApiError("저장 서버에 연결할 수 없습니다. 서버 실행 상태를 확인해 주세요.", 503); }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) {
    if (response.status === 401 && path !== "/admin/login" && path !== "/admin/session") window.dispatchEvent(new Event("yeon-admin-expired"));
    throw new ApiError(data?.error ?? "저장 서버에 연결할 수 없습니다.", response.status || 503);
  }
  return data;
}

export const getProjects = () => api<{ projects: Project[] }>("/projects");

export async function uploadPhoto(file: File, csrfToken: string) {
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) throw new Error("JPG, PNG, WebP, GIF 사진을 선택해 주세요.");
  if (file.size > 10 * 1024 * 1024) throw new Error("사진 한 장의 크기는 10MB 이하여야 합니다.");
  // Re-encode still images to reduce size and remove camera/GPS metadata.
  let photo: Blob = file;
  if (file.type !== "image/gif") {
    const bitmap = await createImageBitmap(file);
    try {
      const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      photo = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("사진을 처리하지 못했습니다.")), file.type === "image/png" ? "image/png" : "image/jpeg", 0.9));
    } finally { bitmap.close(); }
  }
  return api<{ image: string }>("/uploads", { method: "POST", headers: { "Content-Type": photo.type }, body: photo }, csrfToken);
}
