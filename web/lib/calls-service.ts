import { ObjectId } from "mongodb";
import { getDb } from "./db";
import { serializeCall } from "./calls";
import { metricsOnAccept, metricsOnTerminal } from "./call-metrics";
import { publishCallEvent, publishRoomEvent } from "./sse";
import { clearSignalBuffer } from "./signal-buffer";
import type { Call, CallChannel, CallStatus } from "./types";

export type AcceptCallResult =
  | { ok: true; call: Call }
  | { ok: false; reason: "not_found" | "not_pending" | "already_accepted" };

export type TerminalCallResult =
  | { ok: true; call: Call }
  | { ok: false; reason: "not_found" | "not_active" | "not_acceptor" };

function publishCallUpdated(call: Call): void {
  const serialized = serializeCall(call);
  publishCallEvent(
    call.floor,
    call.sector,
    call.targetRole,
    "call:updated",
    serialized,
  );
  publishRoomEvent(call.roomId.toString(), "call:updated", serialized);
}

export async function acceptCall(
  callId: ObjectId,
  userId: ObjectId,
  options?: { channel?: CallChannel },
): Promise<AcceptCallResult> {
  const db = await getDb();
  const existing = await db.collection<Call>("calls").findOne({ _id: callId });

  if (!existing) {
    return { ok: false, reason: "not_found" };
  }

  if (existing.status === "accepted") {
    return { ok: false, reason: "already_accepted" };
  }

  if (existing.status !== "pending") {
    return { ok: false, reason: "not_pending" };
  }

  const acceptedAt = new Date();
  const acceptMetrics = metricsOnAccept(existing, acceptedAt);

  const acceptSet: Partial<Call> = {
    status: "accepted",
    acceptedBy: userId,
    acceptedAt,
    ...acceptMetrics,
  };
  if (options?.channel) {
    acceptSet.acceptedChannel = options.channel;
  }

  const updated = await db.collection<Call>("calls").findOneAndUpdate(
    { _id: callId, status: "pending" },
    { $set: acceptSet },
    { returnDocument: "after" },
  );

  if (!updated) {
    const current = await db.collection<Call>("calls").findOne({ _id: callId });
    if (!current) return { ok: false, reason: "not_found" };
    if (current.status === "accepted") {
      return { ok: false, reason: "already_accepted" };
    }
    return { ok: false, reason: "not_pending" };
  }

  publishCallUpdated(updated);
  return { ok: true, call: updated };
}

export async function completeCall(
  callId: ObjectId,
  userId: ObjectId,
  options?: { requireAcceptedBy?: boolean; channel?: CallChannel },
): Promise<TerminalCallResult> {
  const db = await getDb();
  const call = await db.collection<Call>("calls").findOne({ _id: callId });

  if (!call) {
    return { ok: false, reason: "not_found" };
  }

  if (call.status !== "pending" && call.status !== "accepted") {
    return { ok: false, reason: "not_active" };
  }

  if (
    options?.requireAcceptedBy &&
    call.acceptedBy &&
    !call.acceptedBy.equals(userId)
  ) {
    return { ok: false, reason: "not_acceptor" };
  }

  const status: CallStatus = "completed";
  const completedAt = new Date();
  const terminalMetrics = metricsOnTerminal(call, completedAt);

  const terminalSet: Partial<Call> = {
    status,
    completedAt,
    ...terminalMetrics,
  };
  if (options?.channel) {
    terminalSet.completedChannel = options.channel;
  }

  await db.collection<Call>("calls").updateOne(
    { _id: callId },
    { $set: terminalSet },
  );

  const updated: Call = {
    ...call,
    ...terminalSet,
  };

  clearSignalBuffer(callId.toString());
  publishCallUpdated(updated);
  return { ok: true, call: updated };
}

export async function cancelCall(callId: ObjectId): Promise<TerminalCallResult> {
  const db = await getDb();
  const call = await db.collection<Call>("calls").findOne({ _id: callId });

  if (!call) {
    return { ok: false, reason: "not_found" };
  }

  if (call.status !== "pending" && call.status !== "accepted") {
    return { ok: false, reason: "not_active" };
  }

  const status: CallStatus = "cancelled";
  const completedAt = new Date();
  const terminalMetrics = metricsOnTerminal(call, completedAt);

  await db.collection<Call>("calls").updateOne(
    { _id: callId },
    { $set: { status, completedAt, ...terminalMetrics } },
  );

  const updated: Call = {
    ...call,
    status,
    completedAt,
    ...terminalMetrics,
  };

  clearSignalBuffer(callId.toString());
  publishCallUpdated(updated);
  return { ok: true, call: updated };
}
