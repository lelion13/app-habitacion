import { randomBytes } from "crypto";
import { ObjectId } from "mongodb";
import { getDb } from "./db";
import type { TelegramVideoJoinToken } from "./types";

const TTL_MS = 30 * 60 * 1000;

export function buildVideoJoinUrl(token: string): string {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://habitacion.lionapp.cloud";
  return `${appUrl.replace(/\/$/, "")}/join/video?token=${encodeURIComponent(token)}`;
}

export async function createVideoJoinToken(
  callId: ObjectId,
  userId: ObjectId,
): Promise<string> {
  const db = await getDb();
  const token = randomBytes(24).toString("hex");
  const doc: Omit<TelegramVideoJoinToken, "_id"> = {
    token,
    callId,
    userId,
    expiresAt: new Date(Date.now() + TTL_MS),
    used: false,
    createdAt: new Date(),
  };
  await db
    .collection<TelegramVideoJoinToken>("telegram_video_join_tokens")
    .insertOne(doc as TelegramVideoJoinToken);
  return token;
}

export type ConsumeVideoJoinResult =
  | { ok: true; callId: ObjectId; userId: ObjectId }
  | { ok: false; reason: "invalid" | "expired" | "used" };

export async function consumeVideoJoinToken(
  token: string,
): Promise<ConsumeVideoJoinResult> {
  const db = await getDb();
  const now = new Date();

  const link = await db
    .collection<TelegramVideoJoinToken>("telegram_video_join_tokens")
    .findOne({
      token,
      used: false,
      expiresAt: { $gt: now },
    });

  if (!link) {
    const existing = await db
      .collection<TelegramVideoJoinToken>("telegram_video_join_tokens")
      .findOne({ token });
    if (!existing) return { ok: false, reason: "invalid" };
    if (existing.used) return { ok: false, reason: "used" };
    return { ok: false, reason: "expired" };
  }

  const updated = await db
    .collection<TelegramVideoJoinToken>("telegram_video_join_tokens")
    .findOneAndUpdate(
      { _id: link._id, used: false },
      { $set: { used: true } },
      { returnDocument: "after" },
    );

  if (!updated) {
    return { ok: false, reason: "used" };
  }

  return { ok: true, callId: link.callId, userId: link.userId };
}
