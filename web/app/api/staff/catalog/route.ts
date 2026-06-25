import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUserFromRequest } from "@/lib/admin-auth";
import { serializeFloor, serializeSector } from "@/lib/admin-migrate";
import type { Floor, Sector } from "@/lib/types";

export async function GET(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = await getDb();
  const filter = { active: { $ne: false } };

  const [floors, sectors] = await Promise.all([
    db.collection<Floor>("floors").find(filter).sort({ name: 1 }).toArray(),
    db.collection<Sector>("sectors").find(filter).sort({ code: 1 }).toArray(),
  ]);

  return NextResponse.json({
    floors: floors.map(serializeFloor),
    sectors: sectors.map(serializeSector),
  });
}
