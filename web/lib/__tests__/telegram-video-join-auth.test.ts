import { describe, expect, it } from "@jest/globals";
import { isVideoJoinPayload, signVideoJoinToken, verifyToken } from "../auth";

describe("video join auth", () => {
  it("issues scoped video-join JWT", () => {
    const token = signVideoJoinToken(
      {
        id: "user1",
        email: "a@b.com",
        name: "Ana",
        systemRole: "user",
      },
      "call123",
    );
    const payload = verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.scope).toBe("video-join");
    expect(payload?.callId).toBe("call123");
    expect(isVideoJoinPayload(payload!)).toBe(true);
  });
});
