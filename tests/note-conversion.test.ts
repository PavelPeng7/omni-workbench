import { describe, expect, it } from "vitest";
import { planNoteConversion } from "../src/core/note-conversion";

const input = () => ({ sourcePath: "闪念笔记/想法.md", sourceContent: "---\ntitle: 原题\ntags: [写作, 想法]\ntype: 闪念笔记\n---\n原始正文", templatePath: "模板/永久笔记模板.md", templateContent: "---\ntype: 永久笔记\n状态: 已沉淀\ntags: [知识, 写作]\n---\n# 模板\n\n{{content}}", target: { type: "permanent" as const, folder: "永久笔记", typeValue: "永久笔记", status: "已沉淀" }, folders: ["闪念笔记", "文献笔记", "永久笔记"], conversionDate: "2026-09-13", destinationOccupied: false });

describe("planNoteConversion", () => {
  it("preserves the file name and source body while applying the target format", () => {
    const result = planNoteConversion(input());
    expect(result).toMatchObject({ ok: true, plan: { destinationPath: "永久笔记/想法.md" } });
    if (result.ok) {
      expect(result.plan.content).toContain("type: 永久笔记");
      expect(result.plan.content).toContain("状态: 已沉淀");
      expect(result.plan.content).toContain("tags:\n  - 写作\n  - 想法\n  - 知识");
      expect(result.plan.content.split("原始正文")).toHaveLength(2);
    }
  });

  it("returns no executable plan when the destination is occupied", () => {
    const result = planNoteConversion({ ...input(), destinationOccupied: true });
    expect(result).toEqual({ ok: false, error: "A file or folder already exists at the destination." });
  });

  it("rejects a template that would duplicate the source body", () => {
    const result = planNoteConversion({ ...input(), templateContent: "---\ntype: 永久笔记\n---\n{{content}}\n{{content}}" });
    expect(result).toEqual({ ok: false, error: "The target template contains {{content}} more than once." });
  });

  it("appends the source body once when a valid template omits the placeholder", () => {
    const result = planNoteConversion({ ...input(), templateContent: "---\ntype: 永久笔记\n---\n# 模板正文" });
    expect(result).toMatchObject({ ok: true });
    if (result.ok) expect(result.plan.content).toContain("# 模板正文\n\n原始正文");
  });

  it("rejects overlapping configured knowledge folders before creating a plan", () => {
    const result = planNoteConversion({ ...input(), folders: ["笔记", "笔记/文献", "永久笔记"] });
    expect(result).toEqual({ ok: false, error: "Knowledge-note folders must be configured, unique, and non-overlapping." });
  });

  it("merges every array-valued frontmatter field in stable source-first order", () => {
    const result = planNoteConversion({ ...input(), sourceContent: "---\nrelated: [A, B]\n---\n正文", templateContent: "---\nrelated: [B, C]\n---\n{{content}}" });
    expect(result).toMatchObject({ ok: true });
    if (result.ok) expect(result.plan.content).toContain("related:\n  - A\n  - B\n  - C");
  });

  it("blocks malformed YAML and unsupported files without a plan", () => {
    expect(planNoteConversion({ ...input(), sourceContent: "---\ntags: [broken\n---\n正文" })).toMatchObject({ ok: false, error: "Source frontmatter is invalid." });
    expect(planNoteConversion({ ...input(), sourcePath: "闪念笔记/想法.png" })).toEqual({ ok: false, error: "Only Markdown files can be converted." });
  });
});
