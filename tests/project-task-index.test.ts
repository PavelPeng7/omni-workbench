import { describe, expect, it } from "vitest";
import { planProjectTaskAssignment, renderChildTaskIndex } from "../src/core/project-task-index";

describe("project task index", () => {
  it("moves an independent task into the selected project's child-task folder", () => {
    expect(planProjectTaskAssignment({ sourcePath: "Omni Workbench/任务/周报.md", taskRoot: "Omni Workbench/任务", projectWorkspace: "Omni Workbench/项目/发布", occupiedPaths: [] })).toEqual({ ok: true, destinationPath: "Omni Workbench/项目/发布/任务/周报.md" });
  });

  it("restores a child task to the independent task root", () => {
    expect(planProjectTaskAssignment({ sourcePath: "Omni Workbench/项目/发布/任务/周报.md", taskRoot: "Omni Workbench/任务", occupiedPaths: [] })).toEqual({ ok: true, destinationPath: "Omni Workbench/任务/周报.md" });
  });

  it("replaces only the managed child-task index region", () => {
    expect(renderChildTaskIndex("前言\n<!-- omni:child-tasks:start -->\n旧内容\n<!-- omni:child-tasks:end -->\n结尾", [{ title: "周报", path: "项目/发布/任务/周报.md", status: "待做", priority: "P2" }])).toBe("前言\n<!-- omni:child-tasks:start -->\n## 子任务\n\n- [ ] [[项目/发布/任务/周报|周报]] · 待做 · P2\n<!-- omni:child-tasks:end -->\n结尾");
  });
});
