import type { Call, CallStatus, StaffRole } from "./types";

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
  return {
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
  };
}

export function isTerminalStatus(status: CallStatus): boolean {
  return status === "completed" || status === "cancelled";
}
