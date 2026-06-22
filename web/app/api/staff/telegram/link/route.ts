import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getBearerToken, verifyToken } from "@/lib/auth";
import { createTelegramLinkToken } from "@/lib/telegram-link";
import { isTelegramConfigured } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  const token = getBearerToken(request.headers.get("authorization"));
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!isTelegramConfigured()) {
    return NextResponse.json(
      { error: "Telegram no configurado en el servidor" },
      { status: 503 },
    );
  }

  const { url } = await createTelegramLinkToken(new ObjectId(payload.sub));
  return NextResponse.json({ url });
}
