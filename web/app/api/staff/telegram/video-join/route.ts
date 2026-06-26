import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { signVideoJoinToken } from "@/lib/auth";
import { acceptCall } from "@/lib/calls-service";
import { consumeVideoJoinToken } from "@/lib/telegram-video-join";
import { syncTelegramMessagesForCall } from "@/lib/telegram-call-actions";
import type { Call, User } from "@/lib/types";

export async function POST(request: NextRequest) {
  let body: { token?: string };
  try {
    body = (await request.json()) as { token?: string };
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const token = body.token?.trim();
  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  }

  const consumed = await consumeVideoJoinToken(token);
  if (!consumed.ok) {
    const status =
      consumed.reason === "expired" || consumed.reason === "used" ? 410 : 401;
    return NextResponse.json({ error: "Enlace inválido o expirado" }, { status });
  }

  const db = await getDb();
  const [call, user] = await Promise.all([
    db.collection<Call>("calls").findOne({ _id: consumed.callId }),
    db.collection<User>("users").findOne({ _id: consumed.userId }),
  ]);

  if (!call || !user?._id) {
    return NextResponse.json({ error: "Enlace inválido o expirado" }, { status: 401 });
  }

  if (call.type !== "video") {
    return NextResponse.json({ error: "Enlace no válido para este llamado" }, { status: 400 });
  }

  if (call.status === "completed" || call.status === "cancelled") {
    return NextResponse.json({ error: "Este llamado ya finalizó" }, { status: 410 });
  }

  if (call.status === "accepted") {
    if (!call.acceptedBy?.equals(user._id)) {
      return NextResponse.json(
        { error: "Este llamado ya fue atendido por otro usuario" },
        { status: 409 },
      );
    }
  } else if (call.status === "pending") {
    const accepted = await acceptCall(call._id!, user._id, { channel: "telegram" });
    if (!accepted.ok) {
      if (accepted.reason === "already_accepted") {
        const fresh = await db.collection<Call>("calls").findOne({ _id: call._id });
        if (fresh?.acceptedBy && !fresh.acceptedBy.equals(user._id)) {
          return NextResponse.json(
            { error: "Este llamado ya fue atendido por otro usuario" },
            { status: 409 },
          );
        }
      } else {
        return NextResponse.json({ error: "No se pudo unir al llamado" }, { status: 409 });
      }
    } else {
      void syncTelegramMessagesForCall(accepted.call).catch(() => {});
    }
  }

  const jwt = signVideoJoinToken(
    {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      systemRole: user.systemRole,
    },
    call._id!.toString(),
  );

  return NextResponse.json({
    token: jwt,
    callId: call._id!.toString(),
    listenConfig: {
      floor: call.floor,
      sector: call.sector,
      role: call.targetRole,
    },
  });
}
