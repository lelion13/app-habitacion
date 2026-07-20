import { describe, expect, it } from "@jest/globals";
import {
  FAMILY_INVITE_RATE_LIMIT_MS,
  FAMILY_TOKEN_TTL_MS,
  buildFamilyJoinUrl,
} from "../family-invite";
import { validateEmail, isCallTargetRole, isStaffRole } from "../validation";

describe("family-invite helpers", () => {
  it("uses 3h token TTL and 1h rate limit", () => {
    expect(FAMILY_TOKEN_TTL_MS).toBe(3 * 60 * 60 * 1000);
    expect(FAMILY_INVITE_RATE_LIMIT_MS).toBe(60 * 60 * 1000);
  });

  it("builds join URL with encoded token", () => {
    const url = buildFamilyJoinUrl("abc/def");
    expect(url).toContain("/join/familiar?token=");
    expect(url).toContain(encodeURIComponent("abc/def"));
  });
});

describe("family validation", () => {
  it("accepts strict emails", () => {
    expect(validateEmail("a@b.co")).toBe(true);
    expect(validateEmail("user.name+tag@clinic.org")).toBe(true);
  });

  it("rejects loose emails", () => {
    expect(validateEmail("not-an-email")).toBe(false);
    expect(validateEmail("@nodomain.com")).toBe(false);
    expect(validateEmail("a@b")).toBe(false);
  });

  it("treats family as call target but not staff listen role", () => {
    expect(isCallTargetRole("family")).toBe(true);
    expect(isStaffRole("family")).toBe(false);
  });
});
