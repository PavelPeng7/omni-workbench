export type KnowledgeNoteType = "fleeting" | "literature" | "permanent";
export type KnowledgeNoteTemplatePathKey = "fleetingNoteTemplatePath" | "literatureNoteTemplatePath" | "permanentNoteTemplatePath";
export type VaultEntryKind = "missing" | "file" | "folder";

export interface KnowledgeNoteTemplate {
  type: KnowledgeNoteType;
  path: string;
  content: string;
}

export interface KnowledgeNoteTemplateDefinition {
  type: KnowledgeNoteType;
  pathKey: KnowledgeNoteTemplatePathKey;
  defaultPath: string;
  label: string;
  typeValue: string;
  workflowStatus: string;
  title: string;
  sections: string;
}

export const knowledgeNoteTemplateDefinitions: readonly KnowledgeNoteTemplateDefinition[] = [
  { type: "fleeting", pathKey: "fleetingNoteTemplatePath", defaultPath: "模板/闪念笔记模板.md", label: "闪念笔记模板", typeValue: "闪念笔记", workflowStatus: "收集", title: "闪念笔记", sections: "## 想法\n\n{{content}}\n\n## 后续整理\n\n- [ ] 补充上下文" },
  { type: "literature", pathKey: "literatureNoteTemplatePath", defaultPath: "模板/文献笔记模板.md", label: "文献笔记模板", typeValue: "文献笔记", workflowStatus: "待整理", title: "文献笔记", sections: "## 来源\n\n\n## 摘录与理解\n\n{{content}}" },
  { type: "permanent", pathKey: "permanentNoteTemplatePath", defaultPath: "模板/永久笔记模板.md", label: "永久笔记模板", typeValue: "永久笔记", workflowStatus: "已沉淀", title: "永久笔记", sections: "## 核心观点\n\n{{content}}\n\n## 关联\n\n" },
];

export function knowledgeNoteTemplateDefaults(): Record<KnowledgeNoteTemplatePathKey, string> {
  return knowledgeNoteTemplateDefinitions.reduce((defaults, template) => {
    defaults[template.pathKey] = template.defaultPath;
    return defaults;
  }, {} as Record<KnowledgeNoteTemplatePathKey, string>);
}

export function configuredKnowledgeNoteTemplates(paths: Record<KnowledgeNoteTemplatePathKey, string>): KnowledgeNoteTemplate[] {
  return knowledgeNoteTemplateDefinitions.map(template => ({
    type: template.type,
    path: paths[template.pathKey],
    content: `---\ntype: ${template.typeValue}\n状态: ${template.workflowStatus}\n创建日期: \n---\n\n# ${template.title}\n\n${template.sections}\n`,
  }));
}

export interface KnowledgeNoteTemplateSetupInput {
  templates: readonly KnowledgeNoteTemplate[];
  existingEntries: Readonly<Record<string, VaultEntryKind>>;
}

export interface KnowledgeNoteTemplateConflict {
  type: KnowledgeNoteType;
  path: string;
  reason: "folder" | "duplicate-path";
}

export interface KnowledgeNoteTemplateSetupPlan {
  creations: KnowledgeNoteTemplate[];
  conflicts: KnowledgeNoteTemplateConflict[];
}

/** Plans additive starter-template creation without touching Obsidian APIs. */
export function planKnowledgeNoteTemplateSetup(input: KnowledgeNoteTemplateSetupInput): KnowledgeNoteTemplateSetupPlan {
  const duplicatePaths = new Set<string>();
  const seenPaths = new Set<string>();
  for (const template of input.templates) {
    if (seenPaths.has(template.path)) duplicatePaths.add(template.path);
    seenPaths.add(template.path);
  }

  const creations: KnowledgeNoteTemplate[] = [];
  const conflicts: KnowledgeNoteTemplateConflict[] = [];
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
