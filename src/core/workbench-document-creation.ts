import type { WorkbenchDocumentFolders, WorkbenchDocumentType } from "./workbench-document-model";

export interface WorkbenchDocumentCreationInput {
  type: Extract<WorkbenchDocumentType, "task" | "project">;
  title: string;
  folders: WorkbenchDocumentFolders;
  occupiedPaths: readonly string[];
}

export interface WorkbenchDocumentCreationPlan {
  directories: string[];
  documentPath: string;
}

export type WorkbenchDocumentCreationResult =
  | { ok: true; plan: WorkbenchDocumentCreationPlan }
  | { ok: false; error: string };

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
}

export function planWorkbenchDocumentCreation(input: WorkbenchDocumentCreationInput): WorkbenchDocumentCreationResult {
  const root = normalizePath(input.folders[input.type]);
  const title = input.title.trim();
  if (!root || !title) return { ok: false, error: "A document title and destination folder are required." };

  const occupied = new Set(input.occupiedPaths.map(normalizePath));
  if (input.type === "task") {
    let index = 1;
    for (;;) {
      const suffix = index === 1 ? "" : " " + index;
      const documentPath = root + "/" + title + suffix + ".md";
      if (!occupied.has(documentPath)) return { ok: true, plan: { directories: [root], documentPath } };
      index += 1;
    }
  }

  let index = 1;
  for (;;) {
    const suffix = index === 1 ? "" : " " + index;
    const workspace = root + "/" + title + suffix;
    if (!occupied.has(workspace)) {
      return { ok: true, plan: {
        directories: [root, workspace, workspace + "/任务"],
        documentPath: workspace + "/项目.md",
      } };
    }
    index += 1;
  }
}
