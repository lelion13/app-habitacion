import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import {
  getBearerToken,
  isFamilyJoinPayload,
  isVideoJoinPayload,
  verifyToken,
} from "@/lib/auth";
import { resolveRoomKey } from "@/lib/room-key";
import {
  publishCallChannelEvent,
  publishCallEvent,
  publishRoomEvent,
} from "@/lib/sse";
import {
  bufferSignal,
  getBufferedSignals,
} from "@/lib/signal-buffer";
import {
  buildSignalMessage,
  validateSignalPostBody,
} from "@/lib/webrtc-signal";
import { isStaffRole } from "@/lib/validation";
import type { Call, Room } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };

async function loadAcceptedVideoCall(id: string) {
  if (!ObjectId.isValid(id)) return null;

  const db = await getDb();
  const call = await db
    .collection<Call>("calls")
    .findOne({ _id: new ObjectId(id) });

  if (!call || call.type !== "video" || call.status !== "accepted") {
    return null;
  }

  return call;
}

async function authorizeRoom(
  call: Call,
  roomKey: string,
): Promise<boolean> {
  const db = await getDb();
  const room = await db.collection<Room>("rooms").findOne({ roomKey });
  if (!room?._id) return false;
  return room._id.equals(call.roomId);
}

function authorizeStaffOrFamily(
  callId: string,
  call: Call,
  token: string | null,
): boolean {
  if (!token) return false;
  const payload = verifyToken(token);
  if (!payload) return false;

  if (isFamilyJoinPayload(payload)) {
    return (
      call.targetRole === "family" &&
      payload.callId === callId
    );
  }

  if (isVideoJoinPayload(payload) && payload.callId !== callId) {
    return false;
  }

  return true;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const call = await loadAcceptedVideoCall(id);

  if (!call) {
    return NextResponse.json(
      { error: "Llamado de video no disponible para señalización" },
      { status: 409 },
    );
  }

  const body = validateSignalPostBody(
    (await request.json()) as Parameters<typeof validateSignalPostBody>[0],
  );

  if (!body) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  if (body.from === "room") {
    const authorized = await authorizeRoom(call, body.roomKey!);
    if (!authorized) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  } else {
    const token = getBearerToken(request.headers.get("authorization"));
    if (!authorizeStaffOrFamily(id, call, token)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  const message = buildSignalMessage(id, body.from, body.type, body.payload);
  bufferSignal(message);

  if (body.from === "room") {
    if (call.targetRole === "family") {
      publishCallChannelEvent(id, "webrtc:signal", message);
    } else if (isStaffRole(call.targetRole)) {
      publishCallEvent(
        call.floor,
        call.sector,
        call.targetRole,
        "webrtc:signal",
        message,
      );
    }
  } else {
    publishRoomEvent(call.roomId.toString(), "webrtc:signal", message);
  }

  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const call = await loadAcceptedVideoCall(id);

  if (!call) {
    return NextResponse.json(
      { error: "Llamado de video no disponible" },
      { status: 409 },
    );
  }

  const roomKey = resolveRoomKey(
    request.nextUrl.searchParams.get("key"),
    null,
    process.env.NEXT_PUBLIC_ROOM_KEY,
  );
  const token =
    getBearerToken(request.headers.get("authorization")) ??
    request.nextUrl.searchParams.get("token");

  const asRoom = roomKey && (await authorizeRoom(call, roomKey));
  const asPeer = authorizeStaffOrFamily(id, call, token);

  if (!asRoom && !asPeer) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return NextResponse.json({ signals: getBufferedSignals(id) });
}
