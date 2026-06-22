import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { buildRoomManifest } from "@/lib/room-manifest";
import type { Room } from "@/lib/types";

export async function GET(request: NextRequest) {
  const roomKey = request.nextUrl.searchParams.get("key")?.trim() ?? "";
  if (!roomKey) {
    return NextResponse.json(
      { error: "Clave de habitación requerida" },
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

  const manifest = buildRoomManifest({
    roomKey,
    label: room.label,
    number: room.number,
  });

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "no-cache",
    },
  });
}
