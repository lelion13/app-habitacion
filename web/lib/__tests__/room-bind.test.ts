import { describe, expect, it } from "@jest/globals";
import { pickRoomKeyCandidate } from "../room-bind";

describe("room-bind", () => {
  it("prefers URL key over stored key", () => {
    expect(pickRoomKeyCandidate("room-102-key", "room-101-key")).toBe(
      "room-102-key",
    );
  });

  it("falls back to stored key when URL empty", () => {
    expect(pickRoomKeyCandidate("", "room-101-key")).toBe("room-101-key");
    expect(pickRoomKeyCandidate(null, "room-101-key")).toBe("room-101-key");
  });

  it("returns empty when no key available", () => {
    expect(pickRoomKeyCandidate(null, null)).toBe("");
    expect(pickRoomKeyCandidate("", "")).toBe("");
  });
});
