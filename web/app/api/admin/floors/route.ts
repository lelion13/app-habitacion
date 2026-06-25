import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAuthError, requireAdmin } from "@/lib/admin-auth";
import { serializeFloor } from "@/lib/admin-migrate";
import { validateNonEmpty } from "@/lib/validation";
import type { Floor } from "@/lib/types";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (isAuthError(auth)) return auth.error;

  const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";
  const db = await getDb();
  const filter = includeInactive ? {} : { active: { $ne: false } };

  const floors = await db
    .collection<Floor>("floors")
    .find(filter)
    .sort({ name: 1 })
    .toArray();

  return NextResponse.json({ floors: floors.map(serializeFloor) });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (isAuthError(auth)) return auth.error;

  try {
    const body = (await request.json()) as { name?: string; label?: string };
    const name = body.name?.trim() ?? "";
    const label = body.label?.trim() ?? "";

    if (!validateNonEmpty(name) || !validateNonEmpty(label)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.collection<Floor>("floors").findOne({ name });
    if (existing) {
      return NextResponse.json({ error: "Ya existe un piso con ese nombre" }, { status: 409 });
    }

    const now = new Date();
    const floor: Omit<Floor, "_id"> = {
      name,
      label,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<Floor>("floors").insertOne(floor as Floor);
    return NextResponse.json(
      { floor: serializeFloor({ ...floor, _id: result.insertedId }) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Error al crear piso" }, { status: 500 });
  }
}
