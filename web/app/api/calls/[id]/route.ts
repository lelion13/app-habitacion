import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getBearerToken, isVideoJoinPayload, verifyToken } from "@/lib/auth";
import { serializeCall } from "@/lib/calls";
import {
  acceptCall,
  cancelCall,
  completeCall,
} from "@/lib/calls-service";
import { syncTelegramMessagesForCall } from "@/lib/telegram-call-actions";
import { getDb } from "@/lib/db";
import type { Call } from "@/lib/types";

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

  if (isVideoJoinPayload(payload) && payload.callId !== id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = (await request.json()) as { action?: string };
  const action = body.action;

  if (isVideoJoinPayload(payload) && action === "cancel") {
    return NextResponse.json({ error: "Acción no permitida" }, { status: 400 });
  }

  const callId = new ObjectId(id);
  const userId = new ObjectId(payload.sub);

  if (action === "accept") {
    const result = await acceptCall(callId, userId, { channel: "web" });
    if (!result.ok) {
      const status = result.reason === "not_found" ? 404 : 400;
      return NextResponse.json({ error: "Acción no permitida" }, { status });
    }
    void syncTelegramMessagesForCall(result.call).catch(() => {});
    return NextResponse.json({ call: serializeCall(result.call) });
  }

  if (action === "complete") {
    const result = await completeCall(callId, userId, { channel: "web" });
    if (!result.ok) {
      const status = result.reason === "not_found" ? 404 : 400;
      return NextResponse.json({ error: "Acción no permitida" }, { status });
    }
    void syncTelegramMessagesForCall(result.call).catch(() => {});
    return NextResponse.json({ call: serializeCall(result.call) });
  }

  if (action === "cancel") {
    const result = await cancelCall(callId);
    if (!result.ok) {
      const status = result.reason === "not_found" ? 404 : 400;
      return NextResponse.json({ error: "Acción no permitida" }, { status });
    }
    void syncTelegramMessagesForCall(result.call).catch(() => {});
    return NextResponse.json({ call: serializeCall(result.call) });
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
