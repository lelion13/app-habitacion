import type { Call, CallChannel, CallStatus, StaffRole } from "./types";

export const ACTIVE_CALL_STATUSES: CallStatus[] = ["pending", "accepted"];

export function isActiveCallStatus(status: CallStatus): boolean {
  return ACTIVE_CALL_STATUSES.includes(status);
}

export function matchesListenTarget(
  call: Pick<Call, "floor" | "sector" | "targetRole" | "status">,
  floor: string,
  sector: string,
  role: StaffRole,
): boolean {
  return (
    call.status === "pending" &&
    call.floor === floor &&
    call.sector === sector &&
    call.targetRole === role
  );
}

export function serializeCall(call: Call) {
  const base = {
    id: call._id?.toString() ?? "",
    roomId: call.roomId.toString(),
    roomNumber: call.roomNumber,
    floor: call.floor,
    sector: call.sector,
    type: call.type,
    targetRole: call.targetRole,
    status: call.status,
    createdAt: call.createdAt.toISOString(),
    acceptedBy: call.acceptedBy?.toString(),
    acceptedAt: call.acceptedAt?.toISOString(),
    completedAt: call.completedAt?.toISOString(),
    ...(call.acceptedChannel && { acceptedChannel: call.acceptedChannel }),
    ...(call.completedChannel && { completedChannel: call.completedChannel }),
  };
  return {
    ...base,
    ...(call.responseTimeMs != null && {
      responseTimeMs: call.responseTimeMs,
    }),
    ...(call.totalDurationMs != null && {
      totalDurationMs: call.totalDurationMs,
    }),
    ...(call.sessionDurationMs != null && {
      sessionDurationMs: call.sessionDurationMs,
    }),
  };
}

export type AlertKind = "bell" | "video";

export function resolveAlertKind(
  pendingCalls: Pick<Call, "type">[],
): AlertKind | null {
  if (pendingCalls.some((c) => c.type === "video")) return "video";
  if (pendingCalls.some((c) => c.type === "bell")) return "bell";
  return null;
}

export function isTerminalStatus(status: CallStatus): boolean {
  return status === "completed" || status === "cancelled";
}

export function formatCallChannel(channel?: CallChannel): string {
  if (channel === "web") return "Web";
  if (channel === "telegram") return "Telegram";
  return "—";
}
