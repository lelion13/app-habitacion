import type { ListenConfig } from "./types";
import { listenKey } from "./validation";

type Subscriber = {
  send: (data: string) => void;
  close: () => void;
};

const subscribers = new Map<string, Set<Subscriber>>();

export function subscribeListenChannel(
  config: ListenConfig,
  subscriber: Subscriber,
): () => void {
  const key = listenKey(config);
  if (!subscribers.has(key)) {
    subscribers.set(key, new Set());
  }
  subscribers.get(key)!.add(subscriber);

  return () => {
    const set = subscribers.get(key);
    if (!set) return;
    set.delete(subscriber);
    if (set.size === 0) subscribers.delete(key);
  };
}

export function publishToListenChannel(
  config: ListenConfig,
  event: string,
  payload: unknown,
): void {
  const key = listenKey(config);
  const set = subscribers.get(key);
  if (!set) return;

  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const sub of set) {
    try {
      sub.send(message);
    } catch {
      sub.close();
      set.delete(sub);
    }
  }
}

export function publishCallEvent(
  floor: string,
  sector: string,
  targetRole: ListenConfig["role"],
  event: string,
  payload: unknown,
): void {
  publishToListenChannel({ floor, sector, role: targetRole }, event, payload);
}

/** Canal SSE por callId (señales WebRTC Familiar → guest). */
export function subscribeCallChannel(
  callId: string,
  subscriber: Subscriber,
): () => void {
  const key = `call:${callId}`;
  if (!subscribers.has(key)) {
    subscribers.set(key, new Set());
  }
  subscribers.get(key)!.add(subscriber);

  return () => {
    const set = subscribers.get(key);
    if (!set) return;
    set.delete(subscriber);
    if (set.size === 0) subscribers.delete(key);
  };
}

export function publishCallChannelEvent(
  callId: string,
  event: string,
  payload: unknown,
): void {
  const key = `call:${callId}`;
  const set = subscribers.get(key);
  if (!set) return;

  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const sub of set) {
    try {
      sub.send(message);
    } catch {
      sub.close();
      set.delete(sub);
    }
  }
}

export function subscribeRoomChannel(
  roomId: string,
  subscriber: Subscriber,
): () => void {
  const key = `room:${roomId}`;
  if (!subscribers.has(key)) {
    subscribers.set(key, new Set());
  }
  subscribers.get(key)!.add(subscriber);

  return () => {
    const set = subscribers.get(key);
    if (!set) return;
    set.delete(subscriber);
    if (set.size === 0) subscribers.delete(key);
  };
}

export function publishRoomEvent(
  roomId: string,
  event: string,
  payload: unknown,
): void {
  const key = `room:${roomId}`;
  const set = subscribers.get(key);
  if (!set) return;

  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const sub of set) {
    try {
      sub.send(message);
    } catch {
      sub.close();
      set.delete(sub);
    }
  }
}
