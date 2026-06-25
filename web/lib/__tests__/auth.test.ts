import { describe, expect, it } from "@jest/globals";
import { verifyPassword, hashPassword, signToken, verifyToken } from "../auth";
import { hasAtLeastRole, isSystemRole, normalizeSystemRole } from "../system-roles";
import { buildRoomKeyFromNumber, sanitizeRoomKeyPart } from "../room-key-gen";

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
  it("builds readable keys from room number", () => {
    expect(buildRoomKeyFromNumber("101")).toBe("room-101-key");
    expect(buildRoomKeyFromNumber("s1")).toBe("room-s1-key");
    expect(buildRoomKeyFromNumber("Suite 1")).toBe("room-suite-1-key");
    expect(buildRoomKeyFromNumber("101", 2)).toBe("room-101-2-key");
  });

  it("sanitizes room number slugs", () => {
    expect(sanitizeRoomKeyPart("  201  ")).toBe("201");
    expect(sanitizeRoomKeyPart("A-12")).toBe("a-12");
  });
});
