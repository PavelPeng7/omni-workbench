import type { WorkbenchDocumentType } from "./workbench-document-model";

export type VaultEntryKind = "missing" | "file" | "folder";

export interface WorkbenchDocumentTemplate {
  type: WorkbenchDocumentType;
  path: string;
  content: string;
}

export interface WorkbenchDocumentTemplateConflict {
  type: WorkbenchDocumentType;
  path: string;
  reason: "folder" | "duplicate-path";
}

export interface WorkbenchDocumentTemplateSetupInput {
  templates: readonly WorkbenchDocumentTemplate[];
  existingEntries: Readonly<Record<string, VaultEntryKind>>;
}

export interface WorkbenchDocumentTemplateSetupPlan {
  creations: WorkbenchDocumentTemplate[];
  conflicts: WorkbenchDocumentTemplateConflict[];
}

/** Plans additive starter-template creation without touching Obsidian APIs. */
export function planWorkbenchDocumentTemplateSetup(input: WorkbenchDocumentTemplateSetupInput): WorkbenchDocumentTemplateSetupPlan {
  const duplicatePaths = new Set<string>();
  const seenPaths = new Set<string>();
  for (const template of input.templates) {
    if (seenPaths.has(template.path)) duplicatePaths.add(template.path);
    seenPaths.add(template.path);
  }

  const creations: WorkbenchDocumentTemplate[] = [];
  const conflicts: WorkbenchDocumentTemplateConflict[] = [];
  for (const template of input.templates) {
    if (duplicatePaths.has(template.path)) {
      conflicts.push({ type: template.type, path: template.path, reason: "duplicate-path" });
      continue;
    }

    const entry = input.existingEntries[template.path] ?? "missing";
    if (entry === "missing") creations.push(template);
    if (entry === "folder") conflicts.push({ type: template.type, path: template.path, reason: "folder" });
  }
  return { creations, conflicts };
}
