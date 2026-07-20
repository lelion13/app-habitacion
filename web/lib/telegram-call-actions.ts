import { ObjectId } from "mongodb";
import { getDb } from "./db";
import { acceptCall, completeCall } from "./calls-service";
import { syncTelegramMessagesForCall as syncMessages } from "./telegram";
import { isStaffRole } from "./validation";
import type { Call, StaffSession, User } from "./types";

export type TelegramCallbackAction = "accept" | "complete";

export function parseTelegramCallbackData(
  data: string,
): { action: TelegramCallbackAction; callId: string } | null {
  if (data.startsWith("ca:")) {
    const callId = data.slice(3);
    return ObjectId.isValid(callId) ? { action: "accept", callId } : null;
  }
  if (data.startsWith("cc:")) {
    const callId = data.slice(3);
    return ObjectId.isValid(callId) ? { action: "complete", callId } : null;
  }
  return null;
}

async function resolveUserByChatId(chatId: string): Promise<User | null> {
  const db = await getDb();
  return db.collection<User>("users").findOne({
    telegramChatId: chatId,
    telegramNotifyEnabled: { $ne: false },
  });
}

async function hasActiveListenForCall(
  userId: ObjectId,
  call: Pick<Call, "floor" | "sector" | "targetRole">,
): Promise<boolean> {
  if (!isStaffRole(call.targetRole)) return false;
  const db = await getDb();
  const session = await db.collection<StaffSession>("staff_sessions").findOne({
    userId,
    active: true,
    floor: call.floor,
    sector: call.sector,
    role: call.targetRole,
  });
  return Boolean(session);
}

export type TelegramActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function handleTelegramAccept(
  chatId: string,
  callId: string,
): Promise<TelegramActionResult> {
  const user = await resolveUserByChatId(chatId);
  if (!user?._id) {
    return { ok: false, message: "No autorizado." };
  }

  const db = await getDb();
  const call = await db
    .collection<Call>("calls")
    .findOne({ _id: new ObjectId(callId) });

  if (!call) {
    return { ok: false, message: "Llamado no encontrado." };
  }

  if (call.type !== "bell") {
    return { ok: false, message: "Use el enlace de video para videollamadas." };
  }

  if (!(await hasActiveListenForCall(user._id, call))) {
    return { ok: false, message: "Escucha no activa para esta zona." };
  }

  const result = await acceptCall(call._id!, user._id, { channel: "telegram" });

  if (result.ok) {
    void syncTelegramMessagesForCall(result.call).catch(() => {});
    return { ok: true, message: "Llamado atendido." };
  }

  if (result.reason === "already_accepted") {
    const fresh = await db.collection<Call>("calls").findOne({ _id: call._id });
    if (fresh) {
      void syncTelegramMessagesForCall(fresh).catch(() => {});
    }
    return { ok: false, message: "Ya fue atendido por otro usuario." };
  }

  if (result.reason === "not_pending") {
    const fresh = await db.collection<Call>("calls").findOne({ _id: call._id });
    if (fresh) {
      void syncTelegramMessagesForCall(fresh).catch(() => {});
    }
    return { ok: false, message: "Este llamado ya no está pendiente." };
  }

  return { ok: false, message: "No se pudo atender el llamado." };
}

export async function handleTelegramComplete(
  chatId: string,
  callId: string,
): Promise<TelegramActionResult> {
  const user = await resolveUserByChatId(chatId);
  if (!user?._id) {
    return { ok: false, message: "No autorizado." };
  }

  const db = await getDb();
  const call = await db
    .collection<Call>("calls")
    .findOne({ _id: new ObjectId(callId) });

  if (!call) {
    return { ok: false, message: "Llamado no encontrado." };
  }

  if (call.type !== "bell") {
    return { ok: false, message: "Acción no disponible para video." };
  }

  if (!(await hasActiveListenForCall(user._id, call))) {
    return { ok: false, message: "Escucha no activa para esta zona." };
  }

  const result = await completeCall(call._id!, user._id, {
    requireAcceptedBy: true,
    channel: "telegram",
  });

  if (result.ok) {
    void syncTelegramMessagesForCall(result.call).catch(() => {});
    return { ok: true, message: "Llamado finalizado." };
  }

  if (result.reason === "not_acceptor") {
    return { ok: false, message: "Solo quien atendió puede finalizar." };
  }

  if (result.reason === "not_active") {
    const fresh = await db.collection<Call>("calls").findOne({ _id: call._id });
    if (fresh) {
      void syncTelegramMessagesForCall(fresh).catch(() => {});
    }
    return { ok: false, message: "Este llamado ya finalizó." };
  }

  return { ok: false, message: "No se pudo finalizar el llamado." };
}

export async function syncTelegramMessagesForCall(call: Call): Promise<void> {
  if (!call.telegramAlerts?.length) return;

  const db = await getDb();
  let accepterName: string | undefined;
  if (call.acceptedBy) {
    const accepter = await db.collection<User>("users").findOne({
      _id: call.acceptedBy,
    });
    accepterName = accepter?.name;
  }

  await syncMessages(call, accepterName);
}
