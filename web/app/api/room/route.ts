import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { resolveRoomKey } from "@/lib/room-key";
import type { Room } from "@/lib/types";

export async function GET(request: NextRequest) {
  const roomKey = resolveRoomKey(
    request.nextUrl.searchParams.get("key"),
    null,
    process.env.NEXT_PUBLIC_ROOM_KEY,
  );

  if (!roomKey) {
    return NextResponse.json(
      { error: "Clave de habitación no configurada" },
      { status: 400 },
    );
  }

  const db = await getDb();
  const room = await db.collection<Room>("rooms").findOne({ roomKey });

  if (!room) {
    return NextResponse.json(
      { error: "Habitación no encontrada" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    id: room._id!.toString(),
    number: room.number,
    floor: room.floor,
    sector: room.sector,
    label: room.label,
  });
}
