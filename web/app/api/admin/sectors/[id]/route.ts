import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { countActiveRoomsForSector } from "@/lib/admin-catalog";
import { isAuthError, requireAdmin } from "@/lib/admin-auth";
import { serializeSector } from "@/lib/admin-migrate";
import { validateNonEmpty } from "@/lib/validation";
import type { Sector } from "@/lib/types";

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
      code?: string;
      label?: string;
      active?: boolean;
    };

    const db = await getDb();
    const sectorId = new ObjectId(id);
    const sector = await db.collection<Sector>("sectors").findOne({ _id: sectorId });
    if (!sector) {
      return NextResponse.json({ error: "Sector no encontrado" }, { status: 404 });
    }

    const updates: Partial<Sector> = { updatedAt: new Date() };

    if (body.code !== undefined) {
      const code = body.code.trim().toUpperCase();
      if (!validateNonEmpty(code)) {
        return NextResponse.json({ error: "Código inválido" }, { status: 400 });
      }
      updates.code = code;
    }

    if (body.label !== undefined) {
      const label = body.label.trim();
      if (!validateNonEmpty(label)) {
        return NextResponse.json({ error: "Etiqueta inválida" }, { status: 400 });
      }
      updates.label = label;
    }

    if (body.active === false) {
      const activeRooms = await countActiveRoomsForSector(db, sectorId);
      if (activeRooms > 0) {
        return NextResponse.json(
          { error: "No se puede desactivar: hay habitaciones activas en este sector" },
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

    await db.collection<Sector>("sectors").updateOne({ _id: sectorId }, { $set: updates });

    const nextCode = updates.code ?? sector.code;
    await db.collection("rooms").updateMany(
      { sectorId },
      { $set: { sector: nextCode.trim(), updatedAt: new Date() } },
    );

    const updated = await db.collection<Sector>("sectors").findOne({ _id: sectorId });
    return NextResponse.json({ sector: serializeSector(updated!) });
  } catch {
    return NextResponse.json({ error: "Error al actualizar sector" }, { status: 500 });
  }
}
