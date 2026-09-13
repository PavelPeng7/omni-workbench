export type WorkbenchDocumentType = "task" | "project" | "fleeting" | "literature" | "permanent";

export type WorkbenchDocumentFolders = Readonly<Record<WorkbenchDocumentType, string>>;

export type FolderValidationResult = { ok: true } | { ok: false; error: string };

export interface DocumentTypeResolutionInput {
  path: string;
  frontmatter: Readonly<Record<string, unknown>>;
  folders: WorkbenchDocumentFolders;
}

export type DocumentTypeResolution = {
  type: WorkbenchDocumentType;
  evidence: "frontmatter" | "folder";
} | null;

export interface DestinationPlanInput {
  sourcePath: string;
  targetFolder: string;
  occupiedPaths: readonly string[];
}

export type DestinationPlanResult = { ok: true; destinationPath: string } | { ok: false; error: string };

const typeValues: Readonly<Record<string, WorkbenchDocumentType>> = {
  "任务": "task",
  "项目": "project",
  "闪念笔记": "fleeting",
  "文献笔记": "literature",
  "永久笔记": "permanent",
};

const folderError = "Workbench document folders must be configured, unique, and non-overlapping.";

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
}

function isWithinFolder(path: string, folder: string): boolean {
  return path === folder || path.startsWith(`${folder}/`);
}

export function validateWorkbenchDocumentFolders(folders: WorkbenchDocumentFolders): FolderValidationResult {
  const paths = Object.values(folders).map(normalizePath);
  if (paths.some(path => !path) || new Set(paths).size !== paths.length) return { ok: false, error: folderError };
  if (paths.some((path, index) => paths.some((other, otherIndex) => index !== otherIndex && isWithinFolder(path, other)))) {
    return { ok: false, error: folderError };
  }
  return { ok: true };
}

export function resolveWorkbenchDocumentType(input: DocumentTypeResolutionInput): DocumentTypeResolution {
  const frontmatterType = input.frontmatter.type;
  if (typeof frontmatterType === "string" && typeValues[frontmatterType]) {
    return { type: typeValues[frontmatterType], evidence: "frontmatter" };
  }

  const path = normalizePath(input.path);
  for (const [type, folder] of Object.entries(input.folders) as [WorkbenchDocumentType, string][]) {
    if (isWithinFolder(path, normalizePath(folder))) return { type, evidence: "folder" };
  }
  return null;
}

export function planWorkbenchDocumentDestination(input: DestinationPlanInput): DestinationPlanResult {
  const targetFolder = normalizePath(input.targetFolder);
  const sourcePath = normalizePath(input.sourcePath);
  const fileName = sourcePath.slice(sourcePath.lastIndexOf("/") + 1);
  if (!targetFolder || !fileName.toLowerCase().endsWith(".md")) return { ok: false, error: "A Markdown destination folder and file are required." };

  const extensionIndex = fileName.lastIndexOf(".");
  const baseName = fileName.slice(0, extensionIndex);
  const extension = fileName.slice(extensionIndex);
  const occupied = new Set(input.occupiedPaths.map(normalizePath).filter(path => path !== sourcePath));

  for (let suffix = 1; ; suffix += 1) {
    const candidateName = suffix === 1 ? fileName : `${baseName} ${suffix}${extension}`;
    const destinationPath = `${targetFolder}/${candidateName}`;
    if (!occupied.has(destinationPath)) return { ok: true, destinationPath };
  }
}
