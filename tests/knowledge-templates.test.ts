import { describe, expect, it } from "vitest";
import { configuredKnowledgeNoteTemplates, planKnowledgeNoteTemplateSetup } from "../src/core/knowledge-templates";

describe("planKnowledgeNoteTemplateSetup", () => {
  it("creates only missing knowledge-note templates", () => {
    const plan = planKnowledgeNoteTemplateSetup({
      templates: [
        { type: "fleeting", path: "模板/闪念笔记模板.md", content: "fleeting" },
        { type: "literature", path: "模板/文献笔记模板.md", content: "literature" },
        { type: "permanent", path: "模板/永久笔记模板.md", content: "permanent" },
      ],
      existingEntries: {
        "模板/闪念笔记模板.md": "file",
        "模板/文献笔记模板.md": "missing",
        "模板/永久笔记模板.md": "missing",
      },
    });

    expect(plan.creations).toEqual([
      { type: "literature", path: "模板/文献笔记模板.md", content: "literature" },
      { type: "permanent", path: "模板/永久笔记模板.md", content: "permanent" },
    ]);
    expect(plan.conflicts).toEqual([]);
  });

  it("reports a folder at a template path without replacing it", () => {
    const plan = planKnowledgeNoteTemplateSetup({
      templates: [{ type: "fleeting", path: "模板/闪念笔记模板.md", content: "starter" }],
      existingEntries: { "模板/闪念笔记模板.md": "folder" },
    });

    expect(plan.creations).toEqual([]);
    expect(plan.conflicts).toEqual([{ type: "fleeting", path: "模板/闪念笔记模板.md", reason: "folder" }]);
  });

  it("rejects duplicate paths before any template is created", () => {
    const plan = planKnowledgeNoteTemplateSetup({
      templates: [
        { type: "fleeting", path: "模板/笔记.md", content: "fleeting" },
        { type: "literature", path: "模板/笔记.md", content: "literature" },
      ],
      existingEntries: { "模板/笔记.md": "missing" },
    });

    expect(plan.creations).toEqual([]);
    expect(plan.conflicts).toEqual([
      { type: "fleeting", path: "模板/笔记.md", reason: "duplicate-path" },
      { type: "literature", path: "模板/笔记.md", reason: "duplicate-path" },
    ]);
  });

  it("creates canonical starter content for each knowledge-note type", () => {
    const templates = configuredKnowledgeNoteTemplates({
      fleetingNoteTemplatePath: "模板/闪念笔记模板.md",
      literatureNoteTemplatePath: "模板/文献笔记模板.md",
      permanentNoteTemplatePath: "模板/永久笔记模板.md",
    });

    expect(templates.map(template => [template.type, template.path])).toEqual([
      ["fleeting", "模板/闪念笔记模板.md"],
      ["literature", "模板/文献笔记模板.md"],
      ["permanent", "模板/永久笔记模板.md"],
    ]);
    expect(templates.map(template => template.content)).toEqual(expect.arrayContaining([
      expect.stringContaining("type: 闪念笔记\n状态: 收集"),
      expect.stringContaining("type: 文献笔记\n状态: 待整理"),
      expect.stringContaining("type: 永久笔记\n状态: 已沉淀"),
    ]));
    expect(templates.every(template => template.content.split("{{content}}").length === 2)).toBe(true);
  });
});
