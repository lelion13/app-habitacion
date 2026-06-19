import { describe, expect, it } from "@jest/globals";
import { unlockBellAudio, playBell } from "../bell";

describe("bell", () => {
  it("exports audio helpers", () => {
    expect(typeof unlockBellAudio).toBe("function");
    expect(typeof playBell).toBe("function");
  });
});
