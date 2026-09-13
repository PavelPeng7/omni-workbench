import { describe, expect, it } from "vitest";
import { planWorkbenchDocumentCreation } from "../src/core/workbench-document-creation";

const folders = {
  task: "Omni Workbench/任务",
  project: "Omni Workbench/项目",
  fleeting: "Omni Workbench/闪念笔记",
  literature: "Omni Workbench/文献笔记",
  permanent: "Omni Workbench/永久笔记",
} as const;

describe("planWorkbenchDocumentCreation", () => {
  it("plans an independent task in the Workbench task root", () => {
    expect(planWorkbenchDocumentCreation({ type: "task", title: "整理周报", folders, occupiedPaths: [] })).toEqual({
      ok: true,
      plan: { directories: ["Omni Workbench/任务"], documentPath: "Omni Workbench/任务/整理周报.md" },
    });
  });

  it("plans a project entry document and its child-task directory", () => {
    expect(planWorkbenchDocumentCreation({ type: "project", title: "发布准备", folders, occupiedPaths: [] })).toEqual({
      ok: true,
      plan: {
        directories: ["Omni Workbench/项目", "Omni Workbench/项目/发布准备", "Omni Workbench/项目/发布准备/任务"],
        documentPath: "Omni Workbench/项目/发布准备/项目.md",
      },
    });
  });

  it("chooses a non-conflicting project workspace name", () => {
    expect(planWorkbenchDocumentCreation({
      type: "project",
      title: "发布准备",
      folders,
      occupiedPaths: ["Omni Workbench/项目/发布准备", "Omni Workbench/项目/发布准备 2"],
    })).toMatchObject({ ok: true, plan: { documentPath: "Omni Workbench/项目/发布准备 3/项目.md" } });
  });
});
