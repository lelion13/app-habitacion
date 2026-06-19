import { describe, expect, it } from "@jest/globals";
import { verifyPassword, hashPassword, signToken, verifyToken } from "../auth";

describe("auth", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("secret123");
    expect(await verifyPassword("secret123", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("signs and verifies JWT", () => {
    const token = signToken({
      id: "abc",
      email: "test@hospital.com",
      name: "Test",
    });
    const payload = verifyToken(token);
    expect(payload?.sub).toBe("abc");
    expect(payload?.email).toBe("test@hospital.com");
  });
});
