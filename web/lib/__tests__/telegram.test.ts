import { describe, expect, it } from "@jest/globals";
import {
  buildTelegramDeepLink,
  parseStartLinkPayload,
} from "../telegram-link";
import { formatCallAlertMessage } from "../telegram";

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
    const text = formatCallAlertMessage({
      id: "1",
      roomId: "r",
      roomNumber: "101",
      floor: "1",
      sector: "A",
      type: "video",
      targetRole: "nurse",
      status: "pending",
      createdAt: "2026-06-19T12:00:00.000Z",
    });
    expect(text).toContain("Videollamada");
    expect(text).toContain("101");
    expect(text).toContain("dashboard");
  });
});
