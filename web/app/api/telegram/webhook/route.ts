import { NextRequest, NextResponse } from "next/server";
import {
  consumeTelegramLinkToken,
  parseStartLinkPayload,
} from "@/lib/telegram-link";
import {
  answerCallbackQuery,
  sendTelegramMessage,
} from "@/lib/telegram";
import {
  handleTelegramAccept,
  handleTelegramComplete,
  parseTelegramCallbackData,
} from "@/lib/telegram-call-actions";

export const dynamic = "force-dynamic";

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    from?: { username?: string };
    text?: string;
  };
  callback_query?: {
    id: string;
    data?: string;
    message?: { chat: { id: number } };
    from?: { id: number };
  };
}

function webhookAuthorized(request: NextRequest): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return true;
  return request.headers.get("x-telegram-bot-api-secret-token") === secret;
}

function resolveCallbackChatId(callback: NonNullable<TelegramUpdate["callback_query"]>): string {
  if (callback.message?.chat?.id != null) {
    return String(callback.message.chat.id);
  }
  if (callback.from?.id != null) {
    return String(callback.from.id);
  }
  return "";
}

export async function POST(request: NextRequest) {
  if (!webhookAuthorized(request)) {
    console.warn("[telegram] webhook rejected: invalid secret");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const callback = update.callback_query;
  if (callback?.id) {
    const callbackId = callback.id;
    const data = callback.data ?? "";
    const chatId = resolveCallbackChatId(callback);

    console.info("[telegram] callback_query received", {
      action: data.startsWith("ca:") ? "accept" : data.startsWith("cc:") ? "complete" : "unknown",
      hasChatId: Boolean(chatId),
    });

    try {
      const parsed = data ? parseTelegramCallbackData(data) : null;

      if (!parsed || !chatId) {
        await answerCallbackQuery(callbackId, "Acción no válida.", { alert: true });
        return NextResponse.json({ ok: true });
      }

      const result =
        parsed.action === "accept"
          ? await handleTelegramAccept(chatId, parsed.callId)
          : await handleTelegramComplete(chatId, parsed.callId);

      console.info("[telegram] callback_query handled", {
        action: parsed.action,
        ok: result.ok,
      });

      const answered = await answerCallbackQuery(callbackId, result.message, {
        alert: !result.ok,
      });
      if (!answered) {
        console.warn("[telegram] answerCallbackQuery failed", {
          action: parsed.action,
          ok: result.ok,
        });
      }
    } catch (error) {
      console.error("[telegram] callback_query error", {
        message: error instanceof Error ? error.message : "unknown",
      });
      await answerCallbackQuery(
        callbackId,
        "Error al procesar la acción. Intente desde el dashboard.",
        { alert: true },
      );
    }

    return NextResponse.json({ ok: true });
  }

  const message = update.message;
  if (!message?.text || !message.chat?.id) {
    return NextResponse.json({ ok: true });
  }

  const chatId = String(message.chat.id);
  const text = message.text;

  const linkToken = parseStartLinkPayload(text);
  if (linkToken) {
    const result = await consumeTelegramLinkToken(
      linkToken,
      chatId,
      message.from?.username,
    );

    if (result === "ok") {
      await sendTelegramMessage(
        chatId,
        "✅ Cuenta vinculada. Recibirá alertas cuando tenga <b>escucha activa</b> en el dashboard y haya un llamado para su piso/sector/rol.",
      );
    } else if (result === "expired") {
      await sendTelegramMessage(
        chatId,
        "⏱ El enlace expiró. Genere uno nuevo desde el dashboard (Conectar Telegram).",
      );
    } else {
      await sendTelegramMessage(
        chatId,
        "❌ Enlace inválido o ya usado. Genere uno nuevo desde el dashboard.",
      );
    }
    return NextResponse.json({ ok: true });
  }

  if (text.trim() === "/start" || text.startsWith("/start")) {
    await sendTelegramMessage(
      chatId,
      "👋 Bot de App Habitación.\n\nPara vincular su cuenta, use <b>Conectar Telegram</b> en el dashboard del hospital.",
    );
  }

  return NextResponse.json({ ok: true });
}
