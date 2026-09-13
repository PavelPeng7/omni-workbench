import { describe, expect, it } from "vitest";
import {
  planWorkbenchDocumentDestination,
  resolveWorkbenchDocumentType,
  validateWorkbenchDocumentFolders,
} from "../src/core/workbench-document-model";

const folders = {
  task: "Omni Workbench/任务",
  project: "Omni Workbench/项目",
  fleeting: "Omni Workbench/闪念笔记",
  literature: "Omni Workbench/文献笔记",
  permanent: "Omni Workbench/永久笔记",
} as const;

describe("Workbench document model planner", () => {
  it("accepts five distinct, non-overlapping default document folders", () => {
    expect(validateWorkbenchDocumentFolders(folders)).toEqual({ ok: true });
  });

  it("rejects default folders that overlap", () => {
    expect(validateWorkbenchDocumentFolders({ ...folders, literature: "Omni Workbench/闪念笔记/文献" })).toEqual({
      ok: false,
      error: "Workbench document folders must be configured, unique, and non-overlapping.",
    });
  });

  it("treats a recognized type field as authoritative outside its default folder", () => {
    expect(resolveWorkbenchDocumentType({ path: "收件箱/想法.md", frontmatter: { type: "永久笔记" }, folders })).toEqual({
      type: "permanent",
      evidence: "frontmatter",
    });
  });

  it("uses the configured folder only when type evidence is missing or invalid", () => {
    expect(resolveWorkbenchDocumentType({ path: "Omni Workbench/文献笔记/来源.md", frontmatter: { type: "未知" }, folders })).toEqual({
      type: "literature",
      evidence: "folder",
    });
  });

  it("chooses a non-conflicting destination name without overwriting a vault entry", () => {
    expect(planWorkbenchDocumentDestination({
      sourcePath: "Omni Workbench/闪念笔记/想法.md",
      targetFolder: folders.permanent,
      occupiedPaths: ["Omni Workbench/永久笔记/想法.md", "Omni Workbench/永久笔记/想法 2.md"],
    })).toEqual({ ok: true, destinationPath: "Omni Workbench/永久笔记/想法 3.md" });
  });

  it("refuses to plan a destination for a non-Markdown source", () => {
    expect(planWorkbenchDocumentDestination({
      sourcePath: "收件箱/想法.png",
      targetFolder: folders.fleeting,
      occupiedPaths: [],
    })).toEqual({ ok: false, error: "A Markdown destination folder and file are required." });
  });
});
