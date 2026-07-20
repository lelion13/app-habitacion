import { randomBytes } from "crypto";
import { ObjectId } from "mongodb";
import { getDb } from "./db";
import type { FamilyJoinToken } from "./types";

export const FAMILY_TOKEN_TTL_MS = 3 * 60 * 60 * 1000;
export const FAMILY_INVITE_RATE_LIMIT_MS = 60 * 60 * 1000;

export function buildFamilyJoinUrl(token: string): string {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://habitacion.lionapp.cloud";
  return `${appUrl.replace(/\/$/, "")}/join/familiar?token=${encodeURIComponent(token)}`;
}

export async function createFamilyJoinToken(
  callId: ObjectId,
  roomId: ObjectId,
): Promise<string> {
  const db = await getDb();
  const token = randomBytes(24).toString("hex");
  const doc: Omit<FamilyJoinToken, "_id"> = {
    token,
    callId,
    roomId,
    expiresAt: new Date(Date.now() + FAMILY_TOKEN_TTL_MS),
    used: false,
    createdAt: new Date(),
  };
  await db
    .collection<FamilyJoinToken>("family_join_tokens")
    .insertOne(doc as FamilyJoinToken);
  return token;
}

export type ConsumeFamilyJoinResult =
  | { ok: true; callId: ObjectId; roomId: ObjectId }
  | { ok: false; reason: "invalid" | "expired" | "used" };

export async function consumeFamilyJoinToken(
  token: string,
): Promise<ConsumeFamilyJoinResult> {
  const db = await getDb();
  const now = new Date();

  const link = await db.collection<FamilyJoinToken>("family_join_tokens").findOne({
    token,
    used: false,
    expiresAt: { $gt: now },
  });

  if (!link) {
    const existing = await db
      .collection<FamilyJoinToken>("family_join_tokens")
      .findOne({ token });
    if (!existing) return { ok: false, reason: "invalid" };
    if (existing.used) return { ok: false, reason: "used" };
    return { ok: false, reason: "expired" };
  }

  const updated = await db
    .collection<FamilyJoinToken>("family_join_tokens")
    .findOneAndUpdate(
      { _id: link._id, used: false },
      { $set: { used: true } },
      { returnDocument: "after" },
    );

  if (!updated) {
    return { ok: false, reason: "used" };
  }

  return { ok: true, callId: link.callId, roomId: link.roomId };
}

export async function wasFamilyInviteRecentlySent(
  roomId: ObjectId,
  withinMs = FAMILY_INVITE_RATE_LIMIT_MS,
): Promise<boolean> {
  const db = await getDb();
  const since = new Date(Date.now() - withinMs);
  const recent = await db.collection("calls").findOne({
    roomId,
    targetRole: "family",
    familyInviteSentAt: { $gte: since },
  });
  return Boolean(recent);
}
