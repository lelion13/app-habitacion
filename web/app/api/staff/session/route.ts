import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getBearerToken, verifyToken } from "@/lib/auth";
import { validateListenConfig } from "@/lib/validation";
import type { StaffSession } from "@/lib/types";

export async function PUT(request: NextRequest) {
  const token = getBearerToken(request.headers.get("authorization"));
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as {
    floor?: string;
    sector?: string;
    role?: string;
  };

  if (!validateListenConfig(body as Parameters<typeof validateListenConfig>[0])) {
    return NextResponse.json({ error: "Configuración inválida" }, { status: 400 });
  }

  const db = await getDb();
  const userId = new ObjectId(payload.sub);

  await db.collection<StaffSession>("staff_sessions").updateMany(
    { userId },
    { $set: { active: false } },
  );

  const session: Omit<StaffSession, "_id"> = {
    userId,
    floor: body.floor!,
    sector: body.sector!,
    role: body.role as StaffSession["role"],
    active: true,
    updatedAt: new Date(),
  };

  await db.collection<StaffSession>("staff_sessions").insertOne(session as StaffSession);

  return NextResponse.json({
    listenConfig: {
      floor: session.floor,
      sector: session.sector,
      role: session.role,
    },
  });
}

export async function GET(request: NextRequest) {
  const token = getBearerToken(request.headers.get("authorization"));
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = await getDb();
  const session = await db.collection<StaffSession>("staff_sessions").findOne({
    userId: new ObjectId(payload.sub),
    active: true,
  });

  if (!session) {
    return NextResponse.json({ listenConfig: null });
  }

  return NextResponse.json({
    listenConfig: {
      floor: session.floor,
      sector: session.sector,
      role: session.role,
    },
  });
}

export async function DELETE(request: NextRequest) {
  const token = getBearerToken(request.headers.get("authorization"));
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = await getDb();
  await db.collection<StaffSession>("staff_sessions").updateMany(
    { userId: new ObjectId(payload.sub) },
    { $set: { active: false, updatedAt: new Date() } },
  );

  return NextResponse.json({ listenConfig: null });
}
