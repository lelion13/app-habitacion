import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getBearerToken, verifyToken } from "@/lib/auth";
import { serializeCall } from "@/lib/calls";
import { metricsOnAccept, metricsOnTerminal } from "@/lib/call-metrics";
import { publishCallEvent, publishRoomEvent } from "@/lib/sse";
import { clearSignalBuffer } from "@/lib/signal-buffer";
import type { Call, CallStatus } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const token = getBearerToken(request.headers.get("authorization"));
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const body = (await request.json()) as { action?: string };
  const action = body.action;

  const db = await getDb();
  const call = await db
    .collection<Call>("calls")
    .findOne({ _id: new ObjectId(id) });

  if (!call) {
    return NextResponse.json({ error: "Llamado no encontrado" }, { status: 404 });
  }

  if (action === "accept" && call.status === "pending") {
    const acceptedAt = new Date();
    const acceptMetrics = metricsOnAccept(call, acceptedAt);
    await db.collection<Call>("calls").updateOne(
      { _id: call._id },
      {
        $set: {
          status: "accepted",
          acceptedBy: new ObjectId(payload.sub),
          acceptedAt,
          ...acceptMetrics,
        },
      },
    );
    const updated: Call = {
      ...call,
      status: "accepted",
      acceptedBy: new ObjectId(payload.sub),
      acceptedAt,
      ...acceptMetrics,
    };
    const serialized = serializeCall(updated);
    publishCallEvent(
      call.floor,
      call.sector,
      call.targetRole,
      "call:updated",
      serialized,
    );
    publishRoomEvent(call.roomId.toString(), "call:updated", serialized);
    return NextResponse.json({ call: serialized });
  }

  if (
    (action === "complete" || action === "cancel") &&
    (call.status === "pending" || call.status === "accepted")
  ) {
    const status: CallStatus = action === "complete" ? "completed" : "cancelled";
    const completedAt = new Date();
    const terminalMetrics = metricsOnTerminal(call, completedAt);
    await db.collection<Call>("calls").updateOne(
      { _id: call._id },
      { $set: { status, completedAt, ...terminalMetrics } },
    );
    const updated: Call = {
      ...call,
      status,
      completedAt,
      ...terminalMetrics,
    };
    const serialized = serializeCall(updated);
    clearSignalBuffer(call._id!.toString());
    publishCallEvent(
      call.floor,
      call.sector,
      call.targetRole,
      "call:updated",
      serialized,
    );
    publishRoomEvent(call.roomId.toString(), "call:updated", serialized);
    return NextResponse.json({ call: serialized });
  }

  return NextResponse.json({ error: "Acción no permitida" }, { status: 400 });
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const db = await getDb();
  const call = await db
    .collection<Call>("calls")
    .findOne({ _id: new ObjectId(id) });

  if (!call) {
    return NextResponse.json({ error: "Llamado no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ call: serializeCall(call) });
}
