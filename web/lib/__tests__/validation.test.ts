import { describe, expect, it } from "@jest/globals";
import {
  isStaffRole,
  isCallType,
  validateListenConfig,
  validateEmail,
  listenKey,
} from "../validation";

describe("validation", () => {
  it("validates staff roles and call types", () => {
    expect(isStaffRole("nurse")).toBe(true);
    expect(isStaffRole("admin")).toBe(false);
    expect(isCallType("bell")).toBe(true);
    expect(isCallType("sms")).toBe(false);
  });

  it("validates listen config", () => {
    expect(
      validateListenConfig({ floor: "1", sector: "A", role: "nurse" }),
    ).toBe(true);
    expect(validateListenConfig({ floor: "", sector: "A", role: "nurse" })).toBe(
      false,
    );
  });

  it("validates email", () => {
    expect(validateEmail("a@b.com")).toBe(true);
    expect(validateEmail("invalid")).toBe(false);
  });

  it("builds listen key", () => {
    expect(listenKey({ floor: "2", sector: "B", role: "doctor" })).toBe(
      "2:B:doctor",
    );
  });
});
