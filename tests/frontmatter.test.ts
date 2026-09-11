import { describe, expect, it } from "vitest";
import { setFrontmatterField } from "../src/core/frontmatter";

describe("setFrontmatterField", () => {
  it("replaces an existing field", () => {
    expect(setFrontmatterField("---\n状态: 待做\n---\n", "状态", "完成")).toBe("---\n状态: 完成\n---\n");
  });

  it("escapes regular-expression characters in field names", () => {
    expect(setFrontmatterField("---\na+b?: old\n---", "a+b?", "new")).toBe("---\na+b?: new\n---");
  });

  it("inserts a missing field inside frontmatter", () => {
    expect(setFrontmatterField("---\ntype: task\n---\n# Title", "计划", "2026-09-11")).toBe(
      "---\ntype: task\n计划: 2026-09-11\n---\n# Title",
    );
  });

  it("preserves content when no frontmatter block exists", () => {
    const source = "# Title\n\nBody";
    expect(setFrontmatterField(source, "状态", "完成")).toBe(source);
  });

  it("retains existing replacement line endings", () => {
    expect(setFrontmatterField("---\r\n状态: 待做\r\n---\r\n", "状态", "完成")).toBe("---\r\n状态: 完成\r\n---\r\n");
  });
});
