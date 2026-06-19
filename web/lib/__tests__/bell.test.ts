import { describe, expect, it } from "@jest/globals";
import { unlockBellAudio, playBell, playVideoAlert, syncAlertLoop, stopAlertLoop, isAlertLoopRunning } from "../bell";

describe("bell", () => {
  it("exports audio helpers", () => {
    expect(typeof unlockBellAudio).toBe("function");
    expect(typeof playBell).toBe("function");
    expect(typeof playVideoAlert).toBe("function");
    expect(typeof syncAlertLoop).toBe("function");
    expect(typeof stopAlertLoop).toBe("function");
  });

  it("manages alert loop state", () => {
    stopAlertLoop();
    expect(isAlertLoopRunning()).toBe(false);
    syncAlertLoop(null);
    expect(isAlertLoopRunning()).toBe(false);
  });
});
