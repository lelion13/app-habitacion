import type { WebRtcSignalMessage } from "./webrtc-signal";

const MAX_SIGNALS_PER_CALL = 64;
const buffer = new Map<string, WebRtcSignalMessage[]>();

export function bufferSignal(message: WebRtcSignalMessage): void {
  const list = buffer.get(message.callId) ?? [];
  list.push(message);
  if (list.length > MAX_SIGNALS_PER_CALL) {
    list.splice(0, list.length - MAX_SIGNALS_PER_CALL);
  }
  buffer.set(message.callId, list);
}

export function getBufferedSignals(callId: string): WebRtcSignalMessage[] {
  return buffer.get(callId) ?? [];
}

export function clearSignalBuffer(callId: string): void {
  buffer.delete(callId);
}
