import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { resolveRoomKey } from "@/lib/room-key";
import { roomIsCallable } from "@/lib/admin-catalog";
import { serializeCall, ACTIVE_CALL_STATUSES } from "@/lib/calls";
import { publishRoomEvent } from "@/lib/sse";
import { validateEmail } from "@/lib/validation";
import {
  buildFamilyJoinUrl,
  createFamilyJoinToken,
  wasFamilyInviteRecentlySent,
} from "@/lib/family-invite";
import { isSmtpConfigured, sendFamilyInviteEmail } from "@/lib/smtp";
import type { Call, Room } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    if (!isSmtpConfigured()) {
      return NextResponse.json(
        { error: "El envío de correo no está configurado" },
        { status: 503 },
      );
    }

    const body = (await request.json()) as {
      roomKey?: string;
      email?: string;
      message?: string;
    };

    const roomKey = resolveRoomKey(
      null,
      body.roomKey,
      process.env.NEXT_PUBLIC_ROOM_KEY,
    );
    const email = (body.email ?? "").trim().toLowerCase();
    const message = (body.message ?? "").trim().slice(0, 500);

    if (!roomKey || !validateEmail(email)) {
      return NextResponse.json(
        { error: "Email o habitación inválidos" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const room = await db.collection<Room>("rooms").findOne({ roomKey });

    if (!room?._id) {
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
        { error: "Ya hay un llamado activo. Espere a que finalice." },
        { status: 409 },
      );
    }

    if (await wasFamilyInviteRecentlySent(room._id)) {
      return NextResponse.json(
        {
          error:
            "Solo se permite una invitación Familiar por hora desde esta habitación.",
        },
        { status: 429 },
      );
    }

    const sentAt = new Date();
    const call: Omit<Call, "_id"> = {
      roomId: room._id,
      roomNumber: room.number,
      floor: room.floor,
      sector: room.sector,
      type: "video",
      targetRole: "family",
      status: "pending",
      createdAt: sentAt,
      inviteEmail: email,
      ...(message ? { inviteMessage: message } : {}),
      familyInviteSentAt: sentAt,
    };

    const result = await db.collection<Call>("calls").insertOne(call as Call);
    const created = { ...call, _id: result.insertedId };

    const token = await createFamilyJoinToken(result.insertedId, room._id);
    const joinUrl = buildFamilyJoinUrl(token);

    const mail = await sendFamilyInviteEmail({
      to: email,
      roomLabel: room.label,
      joinUrl,
      message: message || undefined,
    });

    if (!mail.ok) {
      await db.collection<Call>("calls").deleteOne({ _id: result.insertedId });
      await db.collection("family_join_tokens").deleteMany({
        callId: result.insertedId,
      });
      return NextResponse.json(
        { error: "No se pudo enviar el correo. Intente más tarde." },
        { status: 503 },
      );
    }

    const serialized = serializeCall(created as Call);
    publishRoomEvent(room._id.toString(), "call:new", serialized);

    return NextResponse.json({ call: serialized }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear la invitación" },
      { status: 500 },
    );
  }
}
