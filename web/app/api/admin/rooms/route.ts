import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { resolveFloorSectorDenorm } from "@/lib/admin-catalog";
import { isAuthError, requireAdmin } from "@/lib/admin-auth";
import { serializeAdminRoom } from "@/lib/admin-migrate";
import { allocateRoomKey } from "@/lib/room-key-gen";
import { validateNonEmpty } from "@/lib/validation";
import type { Room } from "@/lib/types";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (isAuthError(auth)) return auth.error;

  const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";
  const db = await getDb();
  const filter = includeInactive ? {} : { active: { $ne: false } };

  const rooms = await db
    .collection<Room>("rooms")
    .find(filter)
    .sort({ floor: 1, sector: 1, number: 1 })
    .toArray();

  return NextResponse.json({ rooms: rooms.map(serializeAdminRoom) });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (isAuthError(auth)) return auth.error;

  try {
    const body = (await request.json()) as {
      number?: string;
      label?: string;
      floorId?: string;
      sectorId?: string;
    };

    const number = body.number?.trim() ?? "";
    const label = body.label?.trim() ?? "";
    const floorId = body.floorId ?? "";
    const sectorId = body.sectorId ?? "";

    if (
      !validateNonEmpty(number) ||
      !validateNonEmpty(label) ||
      !ObjectId.isValid(floorId) ||
      !ObjectId.isValid(sectorId)
    ) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const db = await getDb();
    let denorm;
    try {
      denorm = await resolveFloorSectorDenorm(
        db,
        new ObjectId(floorId),
        new ObjectId(sectorId),
      );
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Referencias inválidas" },
        { status: 400 },
      );
    }

    const roomKey = await allocateRoomKey(db, number);

    const now = new Date();
    const room: Omit<Room, "_id"> = {
      number,
      label,
      floorId: new ObjectId(floorId),
      sectorId: new ObjectId(sectorId),
      floor: denorm.floorName,
      sector: denorm.sectorCode,
      roomKey,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<Room>("rooms").insertOne(room as Room);
    return NextResponse.json(
      { room: serializeAdminRoom({ ...room, _id: result.insertedId }) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Error al crear habitación" }, { status: 500 });
  }
}
