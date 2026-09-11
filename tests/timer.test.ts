import { describe, expect, it } from "vitest";
import { elapsedSeconds, expectedSeconds, formatDuration } from "../src/core/timer";

describe("timer helpers", () => {
  it("converts expected minutes and clamps invalid values", () => {
    expect(expectedSeconds(25)).toBe(1500);
    expect(expectedSeconds(-2)).toBe(0);
    expect(expectedSeconds("invalid")).toBe(0);
  });

  it("adds running time to stored elapsed seconds", () => {
    const now = new Date("2026-09-11T10:00:10.900Z").getTime();
    expect(elapsedSeconds({ stored: 20, running: true, started: "2026-09-11T10:00:00.000Z" }, now)).toBe(30);
    expect(elapsedSeconds({ stored: 20, running: false, started: "2026-09-11T10:00:00.000Z" }, now)).toBe(20);
  });

  it("clamps negative stored time and future starts", () => {
    const now = new Date("2026-09-11T10:00:00.000Z").getTime();
    expect(elapsedSeconds({ stored: -5, running: true, started: "2026-09-11T10:00:05.000Z" }, now)).toBe(0);
  });

  it("formats elapsed and overtime durations", () => {
    expect(formatDuration(3661.9)).toBe("01:01:01");
    expect(formatDuration(-61)).toBe("-00:01:01");
  });
});
