import { randomBytes } from "crypto";

export function generateRoomKey(): string {
  const suffix = randomBytes(8).toString("hex");
  return `room-${suffix}`;
}
