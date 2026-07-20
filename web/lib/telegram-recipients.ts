import { getDb } from "./db";
import {
  CALL_TYPE_LABELS,
  ROLE_LABELS,
  type Call,
  type StaffSession,
  type User,
} from "./types";
import { isStaffRole } from "./validation";

import type { ObjectId } from "mongodb";

export interface TelegramRecipient {
  userId: ObjectId;
  chatId: string;
  name: string;
}

export async function findTelegramRecipientsForCall(
  call: Pick<Call, "floor" | "sector" | "targetRole">,
): Promise<TelegramRecipient[]> {
  if (!isStaffRole(call.targetRole)) return [];

  const db = await getDb();

  const sessions = await db
    .collection<StaffSession>("staff_sessions")
    .find({
      active: true,
      floor: call.floor,
      sector: call.sector,
      role: call.targetRole,
    })
    .toArray();

  if (sessions.length === 0) return [];

  const userIds = [
    ...new Map(sessions.map((s) => [s.userId.toString(), s.userId])).values(),
  ];

  const users = await db
    .collection<User>("users")
    .find({
      _id: { $in: userIds },
      telegramChatId: { $exists: true, $type: "string" },
      telegramNotifyEnabled: { $ne: false },
    })
    .toArray();

  return users
    .filter((u) => u.telegramChatId && u._id)
    .map((u) => ({
      userId: u._id!,
      chatId: u.telegramChatId!,
      name: u.name,
    }));
}
