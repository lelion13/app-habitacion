import { describe, expect, it } from "@jest/globals";
import { matchesListenTarget, isTerminalStatus, isActiveCallStatus, resolveAlertKind } from "../calls";
import { ObjectId } from "mongodb";

describe("calls", () => {
  const base = {
    floor: "1",
    sector: "A",
    targetRole: "nurse" as const,
    status: "pending" as const,
    roomId: new ObjectId(),
    roomNumber: "101",
    type: "bell" as const,
    createdAt: new Date(),
  };

  it("matches listen target for pending calls", () => {
    expect(matchesListenTarget(base, "1", "A", "nurse")).toBe(true);
    expect(matchesListenTarget(base, "2", "A", "nurse")).toBe(false);
    expect(
      matchesListenTarget({ ...base, status: "accepted" }, "1", "A", "nurse"),
    ).toBe(false);
  });

  it("detects terminal and active status", () => {
    expect(isTerminalStatus("completed")).toBe(true);
    expect(isTerminalStatus("pending")).toBe(false);
    expect(isActiveCallStatus("pending")).toBe(true);
    expect(isActiveCallStatus("accepted")).toBe(true);
    expect(isActiveCallStatus("completed")).toBe(false);
  });

  it("resolves alert kind with video priority", () => {
    expect(resolveAlertKind([{ type: "bell" }])).toBe("bell");
    expect(
      resolveAlertKind([
        { type: "bell" },
        { type: "video" },
      ]),
    ).toBe("video");
    expect(resolveAlertKind([])).toBeNull();
  });
});
