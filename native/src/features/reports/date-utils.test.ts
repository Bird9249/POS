import { describe, expect, test } from "bun:test";
import { addDaysYmd, rangeForPreset, todayYmd } from "./date-utils";

describe("report date utils", () => {
  test("todayYmd is YYYY-MM-DD", () => {
    expect(todayYmd()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("addDaysYmd rolls calendar day", () => {
    expect(addDaysYmd("2026-07-25", -1)).toBe("2026-07-24");
    expect(addDaysYmd("2026-07-01", -1)).toBe("2026-06-30");
  });

  test("range presets", () => {
    const today = todayYmd();
    expect(rangeForPreset("today")).toEqual({ from: today, to: today });
    const week = rangeForPreset("7d");
    expect(week.to).toBe(today);
    expect(week.from).toBe(addDaysYmd(today, -6));
  });
});
