import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getBearerToken, verifyToken } from "@/lib/auth";
import { isCallType, isStaffRole, validateListenConfig } from "@/lib/validation";
import { resolveRoomKey } from "@/lib/room-key";
import { roomIsCallable } from "@/lib/admin-catalog";
import { serializeCall, ACTIVE_CALL_STATUSES } from "@/lib/calls";
import { publishCallEvent, publishRoomEvent } from "@/lib/sse";
import { notifyTelegramStaffForCall } from "@/lib/telegram";
import type { Call, Room, StaffRole } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      roomKey?: string;
      type?: string;
      targetRole?: string;
    };

    const roomKey = resolveRoomKey(
      null,
      body.roomKey,
      process.env.NEXT_PUBLIC_ROOM_KEY,
    );
    const type = body.type ?? "";
    const targetRole = body.targetRole ?? "";

    if (!roomKey || !isCallType(type) || !isStaffRole(targetRole)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const db = await getDb();
    const room = await db.collection<Room>("rooms").findOne({ roomKey });

    if (!room) {
      return NextResponse.json(
        { error: "Habitación no encontrada" },
        { status: 404 },
      );
    }

    if (!roomIsCallable(room)) {
      return NextResponse.json(
        { error: "Habitación inactiva. Contacte a administración." },
        { status: 403 },
      );
    }

    const active = await db.collection<Call>("calls").findOne({
      roomId: room._id,
      status: { $in: ACTIVE_CALL_STATUSES },
    });

    if (active) {
      return NextResponse.json(
        { error: "Ya hay un llamado activo desde esta habitación" },
        { status: 409 },
      );
    }

    const call: Omit<Call, "_id"> = {
      roomId: room._id!,
      roomNumber: room.number,
      floor: room.floor,
      sector: room.sector,
      type,
      targetRole,
      status: "pending",
      createdAt: new Date(),
    };

    const result = await db.collection<Call>("calls").insertOne(call as Call);
    const created = { ...call, _id: result.insertedId };
    const serialized = serializeCall(created as Call);

    publishCallEvent(room.floor, room.sector, targetRole, "call:new", serialized);
    publishRoomEvent(room._id!.toString(), "call:new", serialized);

    void notifyTelegramStaffForCall(created as Call).catch(() => {
      /* Telegram failure must not affect call creation */
    });

    return NextResponse.json({ call: serialized }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear llamado" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const token = getBearerToken(request.headers.get("authorization"));
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const floor = request.nextUrl.searchParams.get("floor") ?? "";
  const sector = request.nextUrl.searchParams.get("sector") ?? "";
  const role = request.nextUrl.searchParams.get("role") ?? "";

  if (!validateListenConfig({ floor, sector, role: role as StaffRole })) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const staffRole = role as StaffRole;

  const db = await getDb();
  const calls = await db
    .collection<Call>("calls")
    .find({
      floor,
      sector,
      targetRole: staffRole,
      status: { $in: ["pending", "accepted"] },
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();

  return NextResponse.json({
    calls: calls.map(serializeCall),
  });
}
