import { describe, expect, it } from "@jest/globals";
import {
  buildSignalMessage,
  isSignalFrom,
  isSignalType,
  validateSignalPostBody,
} from "../webrtc-signal";
import {
  bufferSignal,
  clearSignalBuffer,
  getBufferedSignals,
} from "../signal-buffer";

describe("webrtc-signal", () => {
  it("validates signal types and from", () => {
    expect(isSignalType("offer")).toBe(true);
    expect(isSignalType("hangup")).toBe(false);
    expect(isSignalFrom("room")).toBe(true);
    expect(isSignalFrom("admin")).toBe(false);
  });

  it("validates room post body requires roomKey", () => {
    expect(
      validateSignalPostBody({
        from: "room",
        type: "offer",
        payload: "sdp",
      }),
    ).toBeNull();

    expect(
      validateSignalPostBody({
        from: "room",
        type: "offer",
        payload: "sdp",
        roomKey: "room-101-key",
      }),
    ).toEqual({
      from: "room",
      type: "offer",
      payload: "sdp",
      roomKey: "room-101-key",
    });
  });

  it("validates staff post body", () => {
    expect(
      validateSignalPostBody({
        from: "staff",
        type: "answer",
        payload: "sdp",
      }),
    ).toEqual({
      from: "staff",
      type: "answer",
      payload: "sdp",
    });
  });

  it("builds signal message", () => {
    expect(buildSignalMessage("abc", "staff", "ice", "{}")).toEqual({
      callId: "abc",
      from: "staff",
      type: "ice",
      payload: "{}",
    });
  });
});

describe("signal-buffer", () => {
  it("stores and clears buffered signals", () => {
    clearSignalBuffer("call-1");
    bufferSignal(
      buildSignalMessage("call-1", "room", "offer", "offer-sdp"),
    );
    expect(getBufferedSignals("call-1")).toHaveLength(1);
    clearSignalBuffer("call-1");
    expect(getBufferedSignals("call-1")).toHaveLength(0);
  });
});
