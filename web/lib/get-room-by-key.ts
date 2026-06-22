import { getDb } from "@/lib/db";
import type { Room } from "@/lib/types";

export interface RoomPublicInfo {
  id: string;
  number: string;
  floor: string;
  sector: string;
  label: string;
}

export async function getRoomByKey(
  roomKey: string,
): Promise<RoomPublicInfo | null> {
  const db = await getDb();
  const room = await db.collection<Room>("rooms").findOne({ roomKey });

  if (!room) return null;

  return {
    id: room._id!.toString(),
    number: room.number,
    floor: room.floor,
    sector: room.sector,
    label: room.label,
  };
}
