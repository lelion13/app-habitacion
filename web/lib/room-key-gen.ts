import type { Db } from "mongodb";
import type { Room } from "./types";

/** Slug estable para roomKey: ej. "101" → "101", "Suite 1" → "suite-1" */
export function sanitizeRoomKeyPart(number: string): string {
  const slug = number
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug;
}

/** Formato legacy: room-101-key, room-s1-key */
export function buildRoomKeyFromNumber(number: string, attempt = 1): string {
  const slug = sanitizeRoomKeyPart(number);
  if (!slug) {
    throw new Error("Número de habitación inválido para generar roomKey");
  }
  if (attempt <= 1) {
    return `room-${slug}-key`;
  }
  return `room-${slug}-${attempt}-key`;
}

export async function allocateRoomKey(db: Db, number: string): Promise<string> {
  for (let attempt = 1; attempt <= 50; attempt += 1) {
    const roomKey = buildRoomKeyFromNumber(number, attempt);
    const exists = await db.collection<Room>("rooms").findOne({ roomKey });
    if (!exists) return roomKey;
  }
  throw new Error("No se pudo generar un roomKey único");
}
