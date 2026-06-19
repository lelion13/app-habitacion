import { describe, expect, it } from "@jest/globals";
import { ObjectId } from "mongodb";
import { metricsOnAccept, metricsOnTerminal } from "../call-metrics";
import type { Call } from "../types";

describe("call-metrics", () => {
  const base: Call = {
    roomId: new ObjectId(),
    roomNumber: "101",
    floor: "1",
    sector: "A",
    type: "bell",
    targetRole: "nurse",
    status: "pending",
    createdAt: new Date("2026-06-19T10:00:00Z"),
  };

  it("computes response time on accept", () => {
    const acceptedAt = new Date("2026-06-19T10:01:30Z");
    expect(metricsOnAccept(base, acceptedAt)).toEqual({
      responseTimeMs: 90_000,
    });
  });

  it("computes total duration on terminal without accept", () => {
    const completedAt = new Date("2026-06-19T10:02:00Z");
    expect(metricsOnTerminal(base, completedAt)).toEqual({
      totalDurationMs: 120_000,
    });
  });

  it("computes session duration when accepted", () => {
    const call: Call = {
      ...base,
      status: "accepted",
      acceptedAt: new Date("2026-06-19T10:01:00Z"),
    };
    const completedAt = new Date("2026-06-19T10:05:00Z");
    expect(metricsOnTerminal(call, completedAt)).toEqual({
      totalDurationMs: 300_000,
      sessionDurationMs: 240_000,
    });
  });
});
