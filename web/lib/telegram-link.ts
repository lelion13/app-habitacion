import { randomBytes } from "crypto";
import { ObjectId } from "mongodb";
import { getDb } from "./db";
import type { TelegramLinkToken, User } from "./types";

const LINK_PREFIX = "link_";
const TTL_MS = 15 * 60 * 1000;

export function getTelegramBotUsername(): string {
  return process.env.TELEGRAM_BOT_USERNAME ?? "habitacionesBot";
}

export function buildTelegramDeepLink(token: string): string {
  const bot = getTelegramBotUsername();
  return `https://t.me/${bot}?start=${LINK_PREFIX}${token}`;
}

export async function createTelegramLinkToken(
  userId: ObjectId,
): Promise<{ token: string; url: string }> {
  const db = await getDb();
  const token = randomBytes(16).toString("hex");
  const doc: Omit<TelegramLinkToken, "_id"> = {
    token,
    userId,
    expiresAt: new Date(Date.now() + TTL_MS),
    used: false,
    createdAt: new Date(),
  };
  await db.collection<TelegramLinkToken>("telegram_link_tokens").insertOne(
    doc as TelegramLinkToken,
  );
  return { token, url: buildTelegramDeepLink(token) };
}

export function parseStartLinkPayload(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("/start ")) return null;
  const payload = trimmed.slice("/start ".length).trim();
  if (!payload.startsWith(LINK_PREFIX)) return null;
  return payload.slice(LINK_PREFIX.length);
}

export async function consumeTelegramLinkToken(
  token: string,
  chatId: string,
  username?: string,
): Promise<"ok" | "invalid" | "expired"> {
  const db = await getDb();
  const now = new Date();

  const link = await db.collection<TelegramLinkToken>("telegram_link_tokens").findOne({
    token,
    used: false,
    expiresAt: { $gt: now },
  });

  if (!link) {
    const expired = await db
      .collection<TelegramLinkToken>("telegram_link_tokens")
      .findOne({ token });
    return expired ? "expired" : "invalid";
  }

  const updated = await db
    .collection<TelegramLinkToken>("telegram_link_tokens")
    .findOneAndUpdate(
      { _id: link._id, used: false },
      { $set: { used: true } },
      { returnDocument: "after" },
    );

  if (!updated) return "invalid";

  await db.collection<User>("users").updateOne(
    { _id: link.userId },
    {
      $set: {
        telegramChatId: chatId,
        telegramUsername: username,
        telegramLinkedAt: now,
        telegramNotifyEnabled: true,
      },
    },
  );

  return "ok";
}

export async function clearTelegramLink(userId: ObjectId): Promise<void> {
  const db = await getDb();
  await db.collection<User>("users").updateOne(
    { _id: userId },
    {
      $unset: {
        telegramChatId: "",
        telegramUsername: "",
        telegramLinkedAt: "",
      },
      $set: { telegramNotifyEnabled: false },
    },
  );
}

export function getTelegramLinkStatus(user: User) {
  return {
    linked: Boolean(user.telegramChatId),
    username: user.telegramUsername ?? null,
    notifyEnabled: user.telegramNotifyEnabled !== false && Boolean(user.telegramChatId),
    linkedAt: user.telegramLinkedAt?.toISOString() ?? null,
  };
}
