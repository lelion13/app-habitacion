import { ObjectId } from "mongodb";
import { getDb } from "./db";
import { serializeCall } from "./calls";
import { findTelegramRecipientsForCall } from "./telegram-recipients";
import {
  buildVideoJoinUrl,
  createVideoJoinToken,
} from "./telegram-video-join";
import {
  CALL_TYPE_LABELS,
  ROLE_LABELS,
  type Call,
  type CallStatus,
  type CallTelegramAlert,
} from "./types";

type SerializedCall = ReturnType<typeof serializeCall>;

type InlineKeyboard = {
  inline_keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>>;
};

function getBotToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN ?? null;
}

export function isTelegramConfigured(): boolean {
  return Boolean(getBotToken());
}

export function isTelegramCallActionsEnabled(): boolean {
  return process.env.TELEGRAM_CALL_ACTIONS !== "false";
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://habitacion.lionapp.cloud";
}

export function formatCallAlertMessage(call: SerializedCall): string {
  return formatCallAlertBody(call);
}

export function formatCallAlertBody(
  call: SerializedCall,
  options?: { accepterName?: string },
): string {
  const typeLabel = CALL_TYPE_LABELS[call.type];
  const roleLabel = ROLE_LABELS[call.targetRole];
  const when = new Date(call.createdAt).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const icon = call.type === "video" ? "📹" : "🔔";
  const lines = [
    `${icon} <b>${statusTitle(call.status, call.type)}</b>`,
    "",
    `🏥 Habitación <b>${call.roomNumber}</b>`,
    `📍 Piso ${call.floor} · Sector ${call.sector}`,
    `👤 Destino: ${roleLabel}`,
    `🕐 ${when}`,
  ];

  if (call.status === "accepted" && options?.accepterName) {
    lines.push("", `✅ Atendido por <b>${options.accepterName}</b>`);
  } else if (call.status === "completed") {
    lines.push("", "✅ <b>Finalizado</b>");
  } else if (call.status === "cancelled") {
    lines.push("", "❌ <b>Cancelado</b>");
  } else if (call.type === "bell") {
    lines.push("", `Tipo: ${typeLabel}`);
  } else {
    lines.push("", `Tipo: ${typeLabel}`);
  }

  lines.push("", `<a href="${getAppUrl()}/dashboard">Abrir dashboard</a>`);
  return lines.join("\n");
}

function statusTitle(status: CallStatus, type: SerializedCall["type"]): string {
  const typeLabel = CALL_TYPE_LABELS[type];
  if (status === "pending") return `Nuevo llamado — ${typeLabel}`;
  if (status === "accepted") return `En curso — ${typeLabel}`;
  if (status === "completed") return `Finalizado — ${typeLabel}`;
  return `Cancelado — ${typeLabel}`;
}

export function buildCallAlertKeyboard(
  call: SerializedCall,
  options: {
    recipientUserId: string;
    videoJoinUrl?: string;
  },
): InlineKeyboard | undefined {
  if (!isTelegramCallActionsEnabled()) return undefined;

  const isAccepter =
    call.acceptedBy != null && call.acceptedBy === options.recipientUserId;

  if (call.status === "pending" && call.type === "bell") {
    return {
      inline_keyboard: [[{ text: "✅ Atender", callback_data: `ca:${call.id}` }]],
    };
  }

  if (call.status === "accepted" && call.type === "bell" && isAccepter) {
    return {
      inline_keyboard: [
        [{ text: "🏁 Finalizar", callback_data: `cc:${call.id}` }],
      ],
    };
  }

  if (
    call.type === "video" &&
    (call.status === "pending" || call.status === "accepted") &&
    options.videoJoinUrl
  ) {
    return {
      inline_keyboard: [[{ text: "📹 Unirse a video", url: options.videoJoinUrl }]],
    };
  }

  return undefined;
}

async function telegramApi<T>(
  method: string,
  body: Record<string, unknown>,
): Promise<T | null> {
  const token = getBotToken();
  if (!token) return null;

  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.warn(`[telegram] ${method} failed`, { status: res.status });
    return null;
  }

  return (await res.json()) as T;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  replyMarkup?: InlineKeyboard,
): Promise<number | null> {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  const result = await telegramApi<{ ok: boolean; result?: { message_id: number } }>(
    "sendMessage",
    body,
  );

  return result?.ok ? (result.result?.message_id ?? null) : null;
}

export async function editCallAlertMessage(
  chatId: string,
  messageId: number,
  text: string,
  replyMarkup?: InlineKeyboard,
): Promise<boolean> {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  } else {
    body.reply_markup = { inline_keyboard: [] };
  }

  const result = await telegramApi<{ ok: boolean }>("editMessageText", body);
  return Boolean(result?.ok);
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text: string,
  options?: { alert?: boolean },
): Promise<boolean> {
  const result = await telegramApi<{ ok: boolean }>("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text: text.slice(0, 200),
    show_alert: options?.alert ?? text.length > 60,
  });
  return Boolean(result?.ok);
}

export async function syncTelegramMessagesForCall(
  call: Call,
  accepterName?: string,
): Promise<void> {
  if (!call.telegramAlerts?.length || !call._id) return;

  const serialized = serializeCall(call);

  await Promise.all(
    call.telegramAlerts.map(async (alert) => {
      const videoJoinUrl =
        call.type === "video" &&
        (call.status === "pending" || call.status === "accepted")
          ? await resolveVideoJoinUrl(call._id!, alert.userId)
          : undefined;

      const text = formatCallAlertBody(serialized, { accepterName });
      const keyboard = buildCallAlertKeyboard(serialized, {
        recipientUserId: alert.userId.toString(),
        videoJoinUrl,
      });

      await editCallAlertMessage(alert.chatId, alert.messageId, text, keyboard);
    }),
  );
}

async function resolveVideoJoinUrl(
  callId: ObjectId,
  userId: ObjectId,
): Promise<string | undefined> {
  const db = await getDb();
  const existing = await db.collection("telegram_video_join_tokens").findOne({
    callId,
    userId,
    used: false,
    expiresAt: { $gt: new Date() },
  });

  if (existing && typeof existing.token === "string") {
    return buildVideoJoinUrl(existing.token);
  }

  const token = await createVideoJoinToken(callId, userId);
  return buildVideoJoinUrl(token);
}

export async function notifyTelegramStaffForCall(call: Call): Promise<void> {
  if (!isTelegramConfigured()) return;

  const serialized = serializeCall(call);
  const recipients = await findTelegramRecipientsForCall(call);
  if (recipients.length === 0) {
    console.info("[telegram] no recipients for call", {
      floor: call.floor,
      sector: call.sector,
      role: call.targetRole,
    });
    return;
  }

  console.info("[telegram] sending call alert", {
    recipientCount: recipients.length,
    floor: call.floor,
    sector: call.sector,
    role: call.targetRole,
  });

  const alerts: CallTelegramAlert[] = [];

  for (const recipient of recipients) {
    let videoJoinUrl: string | undefined;
    if (call.type === "video" && call._id) {
      const token = await createVideoJoinToken(call._id, recipient.userId);
      videoJoinUrl = buildVideoJoinUrl(token);
    }

    const text = formatCallAlertBody(serialized);
    const keyboard = buildCallAlertKeyboard(serialized, {
      recipientUserId: recipient.userId.toString(),
      videoJoinUrl,
    });

    const messageId = await sendTelegramMessage(
      recipient.chatId,
      text,
      keyboard,
    );

    if (messageId != null) {
      alerts.push({
        userId: recipient.userId,
        chatId: recipient.chatId,
        messageId,
      });
    }
  }

  if (alerts.length > 0 && call._id) {
    const db = await getDb();
    await db.collection<Call>("calls").updateOne(
      { _id: call._id },
      { $set: { telegramAlerts: alerts } },
    );
  }

  const failed = recipients.length - alerts.length;
  if (failed > 0) {
    console.warn("[telegram] some messages failed", {
      failed,
      total: recipients.length,
    });
  }
}

export async function registerTelegramWebhook(): Promise<boolean> {
  const token = getBotToken();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!token || !appUrl) return false;

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const body: Record<string, unknown> = {
    url: `${appUrl.replace(/\/$/, "")}/api/telegram/webhook`,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: false,
  };
  if (secret) body.secret_token = secret;

  const res = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return res.ok;
}
