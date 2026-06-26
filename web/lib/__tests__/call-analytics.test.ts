import { describe, expect, it } from "@jest/globals";
import {
  bucketChannel,
  chartRangeExceeded,
  MAX_CHART_DAYS,
} from "../call-analytics";

describe("call-analytics", () => {
  it("detects chart range over 90 days", () => {
    const from = new Date("2026-01-01");
    const to = new Date("2026-06-01");
    expect(chartRangeExceeded(from, to)).toBe(true);

    const within = new Date(from);
    within.setDate(within.getDate() + MAX_CHART_DAYS);
    expect(chartRangeExceeded(from, within)).toBe(false);
  });

  it("buckets channel aggregation rows", () => {
    expect(
      bucketChannel([
        { _id: "web", count: 3 },
        { _id: "telegram", count: 5 },
        { _id: null, count: 2 },
      ]),
    ).toEqual({ web: 3, telegram: 5, unknown: 2 });
  });

  it("handles empty channel rows", () => {
    expect(bucketChannel([])).toEqual({ web: 0, telegram: 0, unknown: 0 });
  });
});
