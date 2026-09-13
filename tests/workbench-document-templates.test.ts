import { describe, expect, it } from "vitest";
import { planWorkbenchDocumentTemplateSetup } from "../src/core/workbench-document-templates";

describe("planWorkbenchDocumentTemplateSetup", () => {
  it("creates only missing templates across all five Workbench document types", () => {
    const plan = planWorkbenchDocumentTemplateSetup({
      templates: [
        { type: "task", path: "模板/任务.md", content: "task" },
        { type: "project", path: "模板/项目.md", content: "project" },
        { type: "fleeting", path: "模板/闪念.md", content: "fleeting" },
        { type: "literature", path: "模板/文献.md", content: "literature" },
        { type: "permanent", path: "模板/永久.md", content: "permanent" },
      ],
      existingEntries: { "模板/任务.md": "file", "模板/项目.md": "missing", "模板/闪念.md": "missing", "模板/文献.md": "file", "模板/永久.md": "missing" },
    });

    expect(plan.creations.map(template => template.type)).toEqual(["project", "fleeting", "permanent"]);
    expect(plan.conflicts).toEqual([]);
  });

  it("reports template path conflicts without planning an overwrite", () => {
    const plan = planWorkbenchDocumentTemplateSetup({
      templates: [
        { type: "task", path: "模板/共用.md", content: "task" },
        { type: "project", path: "模板/共用.md", content: "project" },
      ],
      existingEntries: { "模板/共用.md": "missing" },
    });

    expect(plan.creations).toEqual([]);
    expect(plan.conflicts).toEqual([
      { type: "task", path: "模板/共用.md", reason: "duplicate-path" },
      { type: "project", path: "模板/共用.md", reason: "duplicate-path" },
    ]);
  });
});
