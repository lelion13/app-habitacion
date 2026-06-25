import { describe, expect, it } from "@jest/globals";
import { verifyPassword, hashPassword, signToken, verifyToken } from "../auth";
import { hasAtLeastRole, isSystemRole, normalizeSystemRole } from "../system-roles";
import { generateRoomKey } from "../room-key-gen";

describe("auth", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("secret123");
    expect(await verifyPassword("secret123", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("signs and verifies JWT with systemRole", () => {
    const token = signToken({
      id: "abc",
      email: "test@hospital.com",
      name: "Test",
      systemRole: "admin",
    });
    const payload = verifyToken(token);
    expect(payload?.sub).toBe("abc");
    expect(payload?.email).toBe("test@hospital.com");
    expect(payload?.systemRole).toBe("admin");
  });
});

describe("system-roles", () => {
  it("orders roles cumulatively", () => {
    expect(hasAtLeastRole("admin", "user")).toBe(true);
    expect(hasAtLeastRole("supervisor", "supervisor")).toBe(true);
    expect(hasAtLeastRole("user", "supervisor")).toBe(false);
  });

  it("normalizes unknown roles to user", () => {
    expect(normalizeSystemRole(undefined)).toBe("user");
    expect(isSystemRole("admin")).toBe(true);
    expect(isSystemRole("guest")).toBe(false);
  });
});

describe("room-key-gen", () => {
  it("generates unique room keys with prefix", () => {
    const a = generateRoomKey();
    const b = generateRoomKey();
    expect(a).toMatch(/^room-[a-f0-9]{16}$/);
    expect(a).not.toBe(b);
  });
});
