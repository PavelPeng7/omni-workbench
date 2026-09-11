import { describe, expect, it } from "vitest";
import { calendarKey, dateKey, isPastCalendarDay, parseDate, parseTimestamp, sameCalendarDay } from "../src/core/date";

describe("date helpers", () => {
  it("parses date-only values in local calendar time", () => {
    const parsed = parseDate("2026/9/7");

    expect(parsed).not.toBeNull();
    expect(parsed && [parsed.getFullYear(), parsed.getMonth(), parsed.getDate()]).toEqual([2026, 8, 7]);
    expect(parsed && dateKey(parsed)).toBe("2026-09-07");
  });

  it("accepts Obsidian and Luxon-like date adapters", () => {
    const date = new Date(2026, 8, 11);

    expect(parseDate({ toJSDate: () => date })).toBe(date);
    expect(parseTimestamp({ toJSDate: () => date })).toBe(date);
    expect(calendarKey({ toISODate: () => "2026-09-11" })).toBe("2026-09-11");
  });

  it("normalizes calendar keys without timezone conversion", () => {
    expect(calendarKey("2026/9/7 23:30")).toBe("2026-09-07");
    expect(sameCalendarDay("2026-09-07", "2026/9/7")).toBe(true);
    expect(isPastCalendarDay("2026-09-06", "2026-09-07")).toBe(true);
  });

  it("returns empty results for invalid values", () => {
    expect(parseDate("not-a-date")).toBeNull();
    expect(parseTimestamp("not-a-date")).toBeNull();
    expect(calendarKey("not-a-date")).toBe("");
  });
});
