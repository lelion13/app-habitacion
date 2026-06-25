import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { resolveFloorSectorDenorm } from "@/lib/admin-catalog";
import { isAuthError, requireAdmin } from "@/lib/admin-auth";
import { serializeAdminRoom } from "@/lib/admin-migrate";
import { validateNonEmpty } from "@/lib/validation";
import type { Room } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin(request);
  if (isAuthError(auth)) return auth.error;

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as {
      number?: string;
      label?: string;
      floorId?: string;
      sectorId?: string;
      active?: boolean;
    };

    const db = await getDb();
    const roomId = new ObjectId(id);
    const room = await db.collection<Room>("rooms").findOne({ _id: roomId });
    if (!room) {
      return NextResponse.json({ error: "Habitación no encontrada" }, { status: 404 });
    }

    const updates: Partial<Room> = { updatedAt: new Date() };

    if (body.number !== undefined) {
      const number = body.number.trim();
      if (!validateNonEmpty(number)) {
        return NextResponse.json({ error: "Número inválido" }, { status: 400 });
      }
      updates.number = number;
    }

    if (body.label !== undefined) {
      const label = body.label.trim();
      if (!validateNonEmpty(label)) {
        return NextResponse.json({ error: "Etiqueta inválida" }, { status: 400 });
      }
      updates.label = label;
    }

    const floorId = body.floorId ?? room.floorId?.toString();
    const sectorId = body.sectorId ?? room.sectorId?.toString();

    if (body.floorId !== undefined || body.sectorId !== undefined) {
      if (!floorId || !sectorId || !ObjectId.isValid(floorId) || !ObjectId.isValid(sectorId)) {
        return NextResponse.json({ error: "Piso o sector inválido" }, { status: 400 });
      }
      try {
        const denorm = await resolveFloorSectorDenorm(
          db,
          new ObjectId(floorId),
          new ObjectId(sectorId),
        );
        updates.floorId = new ObjectId(floorId);
        updates.sectorId = new ObjectId(sectorId);
        updates.floor = denorm.floorName;
        updates.sector = denorm.sectorCode;
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Referencias inválidas" },
          { status: 400 },
        );
      }
    }

    if (body.active !== undefined) {
      updates.active = Boolean(body.active);
    }

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
    }

    await db.collection<Room>("rooms").updateOne({ _id: roomId }, { $set: updates });
    const updated = await db.collection<Room>("rooms").findOne({ _id: roomId });
    return NextResponse.json({ room: serializeAdminRoom(updated!) });
  } catch {
    return NextResponse.json({ error: "Error al actualizar habitación" }, { status: 500 });
  }
}
