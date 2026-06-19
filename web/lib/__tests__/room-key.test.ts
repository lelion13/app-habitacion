import { describe, expect, it } from "@jest/globals";
import { resolveRoomKey } from "../room-key";

describe("room-key", () => {
  it("prefers query over body over env", () => {
    expect(resolveRoomKey("query-key", "body-key", "env-key")).toBe("query-key");
    expect(resolveRoomKey("", "body-key", "env-key")).toBe("body-key");
    expect(resolveRoomKey(null, undefined, "env-key")).toBe("env-key");
  });

  it("returns empty when nothing provided", () => {
    expect(resolveRoomKey(null, null, undefined)).toBe("");
  });
});
