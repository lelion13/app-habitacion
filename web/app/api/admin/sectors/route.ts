import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAuthError, requireAdmin } from "@/lib/admin-auth";
import { serializeSector } from "@/lib/admin-migrate";
import { validateNonEmpty } from "@/lib/validation";
import type { Sector } from "@/lib/types";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (isAuthError(auth)) return auth.error;

  const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";
  const db = await getDb();
  const filter = includeInactive ? {} : { active: { $ne: false } };

  const sectors = await db
    .collection<Sector>("sectors")
    .find(filter)
    .sort({ code: 1 })
    .toArray();

  return NextResponse.json({ sectors: sectors.map(serializeSector) });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (isAuthError(auth)) return auth.error;

  try {
    const body = (await request.json()) as { code?: string; label?: string };
    const code = body.code?.trim().toUpperCase() ?? "";
    const label = body.label?.trim() ?? "";

    if (!validateNonEmpty(code) || !validateNonEmpty(label)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.collection<Sector>("sectors").findOne({ code });
    if (existing) {
      return NextResponse.json({ error: "Ya existe un sector con ese código" }, { status: 409 });
    }

    const now = new Date();
    const sector: Omit<Sector, "_id"> = {
      code,
      label,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<Sector>("sectors").insertOne(sector as Sector);
    return NextResponse.json(
      { sector: serializeSector({ ...sector, _id: result.insertedId }) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Error al crear sector" }, { status: 500 });
  }
}
