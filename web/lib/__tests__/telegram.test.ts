import { describe, expect, it } from "@jest/globals";
import {
  buildTelegramDeepLink,
  parseStartLinkPayload,
} from "../telegram-link";
import {
  buildCallAlertKeyboard,
  formatCallAlertBody,
  formatCallAlertMessage,
} from "../telegram";
import { parseTelegramCallbackData } from "../telegram-call-actions";
import { buildVideoJoinUrl } from "../telegram-video-join";

const sampleCall = {
  id: "674a1b2c3d4e5f6789012345",
  roomId: "r",
  roomNumber: "101",
  floor: "1",
  sector: "A",
  type: "video" as const,
  targetRole: "nurse" as const,
  status: "pending" as const,
  createdAt: "2026-06-19T12:00:00.000Z",
};

describe("telegram-link", () => {
  it("parses /start link payload", () => {
    expect(parseStartLinkPayload("/start link_abc123")).toBe("abc123");
    expect(parseStartLinkPayload("/start hello")).toBeNull();
    expect(parseStartLinkPayload("/help")).toBeNull();
  });

  it("builds deep link", () => {
    process.env.TELEGRAM_BOT_USERNAME = "habitacionesBot";
    expect(buildTelegramDeepLink("tok")).toBe(
      "https://t.me/habitacionesBot?start=link_tok",
    );
  });
});

describe("telegram message", () => {
  it("formats call alert in Spanish", () => {
    const text = formatCallAlertMessage(sampleCall);
    expect(text).toContain("Videollamada");
    expect(text).toContain("101");
    expect(text).toContain("dashboard");
  });

  it("includes accepter name when accepted", () => {
    const text = formatCallAlertBody(
      { ...sampleCall, type: "bell", status: "accepted" },
      { accepterName: "Ana" },
    );
    expect(text).toContain("Ana");
    expect(text).toContain("En curso");
  });
});

describe("telegram callbacks", () => {
  it("parses accept and complete callback data", () => {
    const callId = "674a1b2c3d4e5f6789012345";
    expect(parseTelegramCallbackData(`ca:${callId}`)).toEqual({
      action: "accept",
      callId,
    });
    expect(parseTelegramCallbackData(`cc:${callId}`)).toEqual({
      action: "complete",
      callId,
    });
    expect(parseTelegramCallbackData("invalid")).toBeNull();
    expect(parseTelegramCallbackData("ca:not-valid")).toBeNull();
  });
});

describe("telegram keyboards", () => {
  it("builds Atender for pending bell", () => {
    const keyboard = buildCallAlertKeyboard(
      { ...sampleCall, type: "bell" },
      { recipientUserId: "user1" },
    );
    expect(keyboard?.inline_keyboard[0][0].callback_data).toBe(
      `ca:${sampleCall.id}`,
    );
  });

  it("builds Finalizar for accepted bell accepter", () => {
    const keyboard = buildCallAlertKeyboard(
      {
        ...sampleCall,
        type: "bell",
        status: "accepted",
        acceptedBy: "user1",
      },
      { recipientUserId: "user1" },
    );
    expect(keyboard?.inline_keyboard[0][0].callback_data).toBe(
      `cc:${sampleCall.id}`,
    );
  });

  it("builds video join URL button", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://habitacion.lionapp.cloud";
    const url = buildVideoJoinUrl("abc123");
    expect(url).toContain("/join/video?token=abc123");
    const keyboard = buildCallAlertKeyboard(sampleCall, {
      recipientUserId: "user1",
      videoJoinUrl: url,
    });
    expect(keyboard?.inline_keyboard[0][0].url).toBe(url);
  });
});
