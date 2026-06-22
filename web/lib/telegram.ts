import { CALL_TYPE_LABELS, ROLE_LABELS, type Call } from "./types";
import { serializeCall } from "./calls";
import { findTelegramRecipientsForCall } from "./telegram-recipients";

type SerializedCall = ReturnType<typeof serializeCall>;

function getBotToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN ?? null;
}

export function isTelegramConfigured(): boolean {
  return Boolean(getBotToken());
}

export function formatCallAlertMessage(call: SerializedCall): string {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://habitacion.lionapp.cloud";
  const typeLabel = CALL_TYPE_LABELS[call.type];
  const roleLabel = ROLE_LABELS[call.targetRole];
  const when = new Date(call.createdAt).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const icon = call.type === "video" ? "📹" : "🔔";

  return [
    `${icon} <b>Nuevo llamado — ${typeLabel}</b>`,
    "",
    `🏥 Habitación <b>${call.roomNumber}</b>`,
    `📍 Piso ${call.floor} · Sector ${call.sector}`,
    `👤 Destino: ${roleLabel}`,
    `🕐 ${when}`,
    "",
    `<a href="${appUrl}/dashboard">Abrir dashboard</a>`,
  ].join("\n");
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
): Promise<boolean> {
  const token = getBotToken();
  if (!token) return false;

  const res = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    },
  );

  return res.ok;
}

export async function notifyTelegramStaffForCall(call: Call): Promise<void> {
  if (!isTelegramConfigured()) return;

  const serialized = serializeCall(call);
  const recipients = await findTelegramRecipientsForCall(call);
  if (recipients.length === 0) return;

  const text = formatCallAlertMessage(serialized);
  await Promise.all(
    recipients.map((r) => sendTelegramMessage(r.chatId, text)),
  );
}

export async function registerTelegramWebhook(): Promise<boolean> {
  const token = getBotToken();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!token || !appUrl) return false;

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const body: Record<string, string> = {
    url: `${appUrl.replace(/\/$/, "")}/api/telegram/webhook`,
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
