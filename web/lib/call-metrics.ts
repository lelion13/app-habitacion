import type { Call } from "./types";

export function metricsOnAccept(
  call: Call,
  acceptedAt: Date,
): Pick<Call, "responseTimeMs"> {
  return {
    responseTimeMs: acceptedAt.getTime() - call.createdAt.getTime(),
  };
}

export function metricsOnTerminal(
  call: Call,
  completedAt: Date,
): Pick<Call, "totalDurationMs" | "sessionDurationMs"> {
  const totalDurationMs = completedAt.getTime() - call.createdAt.getTime();
  const result: Pick<Call, "totalDurationMs" | "sessionDurationMs"> = {
    totalDurationMs,
  };
  if (call.acceptedAt) {
    result.sessionDurationMs =
      completedAt.getTime() - call.acceptedAt.getTime();
  }
  return result;
}
