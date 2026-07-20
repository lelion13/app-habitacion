import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ACTIVE_CALL_STATUSES, serializeCall } from "@/lib/calls";
import { metricsOnTerminal } from "@/lib/call-metrics";
import { resolveRoomKey } from "@/lib/room-key";
import { publishCallEvent, publishRoomEvent } from "@/lib/sse";
import { clearSignalBuffer } from "@/lib/signal-buffer";
import { syncTelegramMessagesForCall } from "@/lib/telegram-call-actions";
import { isStaffRole } from "@/lib/validation";
import type { Call, Room } from "@/lib/types";

async function resolveRoom(roomKey: string): Promise<Room | null> {
  const db = await getDb();
  return db.collection<Room>("rooms").findOne({ roomKey });
}

export async function GET(request: NextRequest) {
  const roomKey = resolveRoomKey(
    request.nextUrl.searchParams.get("key"),
    null,
    process.env.NEXT_PUBLIC_ROOM_KEY,
  );

  if (!roomKey) {
    return NextResponse.json(
      { error: "Clave de habitación no configurada" },
      { status: 400 },
    );
  }

  const room = await resolveRoom(roomKey);
  if (!room) {
    return NextResponse.json(
      { error: "Habitación no encontrada" },
      { status: 404 },
    );
  }

  const db = await getDb();
  const call = await db.collection<Call>("calls").findOne({
    roomId: room._id,
    status: { $in: ACTIVE_CALL_STATUSES },
  });

  return NextResponse.json({
    call: call ? serializeCall(call) : null,
  });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as { roomKey?: string; action?: string };
    const roomKey = resolveRoomKey(
      request.nextUrl.searchParams.get("key"),
      body.roomKey,
      process.env.NEXT_PUBLIC_ROOM_KEY,
    );
    const action = body.action ?? "cancel";

    if (!roomKey || action !== "cancel") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const room = await resolveRoom(roomKey);
    if (!room) {
      return NextResponse.json(
        { error: "Habitación no encontrada" },
        { status: 404 },
      );
    }

    const db = await getDb();
    const call = await db.collection<Call>("calls").findOne({
      roomId: room._id,
      status: { $in: ACTIVE_CALL_STATUSES },
    });

    if (!call) {
      return NextResponse.json({ call: null });
    }

    const completedAt = new Date();
    const terminalMetrics = metricsOnTerminal(call, completedAt);

    await db.collection<Call>("calls").updateOne(
      { _id: call._id },
      {
        $set: {
          status: "cancelled",
          completedAt,
          ...terminalMetrics,
        },
      },
    );

    const updated: Call = {
      ...call,
      status: "cancelled",
      completedAt,
      ...terminalMetrics,
    };
    const serialized = serializeCall(updated);
    clearSignalBuffer(call._id!.toString());

    if (isStaffRole(call.targetRole)) {
      publishCallEvent(
        call.floor,
        call.sector,
        call.targetRole,
        "call:updated",
        serialized,
      );
    }
    publishRoomEvent(room._id!.toString(), "call:updated", serialized);

    void syncTelegramMessagesForCall(updated).catch(() => {});

    return NextResponse.json({ call: serialized });
  } catch {
    return NextResponse.json({ error: "Error al cancelar llamado" }, { status: 500 });
  }
}
