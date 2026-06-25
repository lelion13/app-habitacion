import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { countActiveRoomsForFloor } from "@/lib/admin-catalog";
import { isAuthError, requireAdmin } from "@/lib/admin-auth";
import { serializeFloor } from "@/lib/admin-migrate";
import { validateNonEmpty } from "@/lib/validation";
import type { Floor } from "@/lib/types";

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
      name?: string;
      label?: string;
      active?: boolean;
    };

    const db = await getDb();
    const floorId = new ObjectId(id);
    const floor = await db.collection<Floor>("floors").findOne({ _id: floorId });
    if (!floor) {
      return NextResponse.json({ error: "Piso no encontrado" }, { status: 404 });
    }

    const updates: Partial<Floor> = { updatedAt: new Date() };

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!validateNonEmpty(name)) {
        return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
      }
      updates.name = name;
    }

    if (body.label !== undefined) {
      const label = body.label.trim();
      if (!validateNonEmpty(label)) {
        return NextResponse.json({ error: "Etiqueta inválida" }, { status: 400 });
      }
      updates.label = label;
    }

    if (body.active === false) {
      const activeRooms = await countActiveRoomsForFloor(db, floorId);
      if (activeRooms > 0) {
        return NextResponse.json(
          { error: "No se puede desactivar: hay habitaciones activas en este piso" },
          { status: 409 },
        );
      }
      updates.active = false;
    } else if (body.active === true) {
      updates.active = true;
    }

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
    }

    await db.collection<Floor>("floors").updateOne({ _id: floorId }, { $set: updates });

    const nextName = updates.name ?? floor.name;
    await db.collection("rooms").updateMany(
      { floorId },
      { $set: { floor: nextName.trim(), updatedAt: new Date() } },
    );

    const updated = await db.collection<Floor>("floors").findOne({ _id: floorId });
    return NextResponse.json({ floor: serializeFloor(updated!) });
  } catch {
    return NextResponse.json({ error: "Error al actualizar piso" }, { status: 500 });
  }
}
