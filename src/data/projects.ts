export type TextBlock = { id: string; type: "text"; text: string; style: "body" | "heading" | "quote"; align: "left" | "center"; bold: boolean };
export type ImageBlock = { id: string; type: "image"; image: string; caption: string };
export type ProjectBlock = TextBlock | ImageBlock;
export type Project = { id: string; name: string; image: string; category: string; blocks: ProjectBlock[]; createdAt: string; updatedAt: string };
export type ProjectInput = Pick<Project, "name" | "image" | "category" | "blocks">;
