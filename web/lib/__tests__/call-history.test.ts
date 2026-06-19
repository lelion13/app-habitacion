import { describe, expect, it } from "@jest/globals";
import { buildHistoryMatch, parseHistoryParams, roundAvg } from "../call-history";

describe("call-history", () => {
  it("parses valid params with defaults", () => {
    const result = parseHistoryParams(new URLSearchParams());
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.to.getTime()).toBeGreaterThan(result.from.getTime());
  });

  it("rejects invalid type", () => {
    const result = parseHistoryParams(new URLSearchParams("type=invalid"));
    expect(result).toEqual({ error: "Tipo inválido" });
  });

  it("builds match with filters", () => {
    const from = new Date("2026-06-01");
    const to = new Date("2026-06-19");
    const match = buildHistoryMatch({
      from,
      to,
      floor: "1",
      sector: "A",
      page: 1,
      limit: 20,
    });
    expect(match.floor).toBe("1");
    expect(match.sector).toBe("A");
    expect(match.createdAt).toEqual({ $gte: from, $lte: to });
  });

  it("rounds averages", () => {
    expect(roundAvg(1234.6)).toBe(1235);
    expect(roundAvg(null)).toBeNull();
  });
});
