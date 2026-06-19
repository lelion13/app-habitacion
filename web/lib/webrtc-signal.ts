export type SignalFrom = "room" | "staff";
export type SignalType = "offer" | "answer" | "ice";

export interface WebRtcSignalMessage {
  callId: string;
  from: SignalFrom;
  type: SignalType;
  payload: string;
}

export interface SignalPostBody {
  from?: string;
  type?: string;
  payload?: string;
  roomKey?: string;
}

const SIGNAL_TYPES: SignalType[] = ["offer", "answer", "ice"];
const SIGNAL_FROM: SignalFrom[] = ["room", "staff"];

export function isSignalType(value: string): value is SignalType {
  return SIGNAL_TYPES.includes(value as SignalType);
}

export function isSignalFrom(value: string): value is SignalFrom {
  return SIGNAL_FROM.includes(value as SignalFrom);
}

export function validateSignalPostBody(
  body: SignalPostBody,
): { from: SignalFrom; type: SignalType; payload: string; roomKey?: string } | null {
  if (
    typeof body.from !== "string" ||
    !isSignalFrom(body.from) ||
    typeof body.type !== "string" ||
    !isSignalType(body.type) ||
    typeof body.payload !== "string" ||
    body.payload.length === 0
  ) {
    return null;
  }

  if (body.from === "room") {
    const roomKey = body.roomKey?.trim();
    if (!roomKey) return null;
    return {
      from: body.from,
      type: body.type,
      payload: body.payload,
      roomKey,
    };
  }

  return {
    from: body.from,
    type: body.type,
    payload: body.payload,
  };
}

export function buildSignalMessage(
  callId: string,
  from: SignalFrom,
  type: SignalType,
  payload: string,
): WebRtcSignalMessage {
  return { callId, from, type, payload };
}
