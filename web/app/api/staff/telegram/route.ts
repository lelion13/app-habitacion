import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getBearerToken, verifyToken } from "@/lib/auth";
import { clearTelegramLink, getTelegramLinkStatus } from "@/lib/telegram-link";
import type { User } from "@/lib/types";

async function getAuthedUserId(
  authHeader: string | null,
): Promise<ObjectId | null> {
  const token = getBearerToken(authHeader);
  const payload = token ? verifyToken(token) : null;
  if (!payload) return null;
  return new ObjectId(payload.sub);
}

export async function GET(request: Request) {
  const userId = await getAuthedUserId(request.headers.get("authorization"));
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = await getDb();
  const user = await db.collection<User>("users").findOne({ _id: userId });
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json(getTelegramLinkStatus(user));
}

export async function DELETE(request: Request) {
  const userId = await getAuthedUserId(request.headers.get("authorization"));
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await clearTelegramLink(userId);
  return NextResponse.json({ linked: false });
}
