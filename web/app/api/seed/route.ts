import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import type { Room, User } from "@/lib/types";

export async function POST(request: NextRequest) {
  const isProd = process.env.NODE_ENV === "production";
  const bootstrapEnabled = process.env.BOOTSTRAP_ENABLED === "true";

  if (isProd && !bootstrapEnabled) {
    return NextResponse.json(
      { error: "Seed no disponible en producción" },
      { status: 403 },
    );
  }

  const secret = request.headers.get("x-seed-secret");
  if (secret !== process.env.JWT_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = await getDb();

  const rooms: Omit<Room, "_id">[] = [
    {
      number: "101",
      floor: "1",
      sector: "A",
      roomKey: "room-101-key",
      label: "Habitación 101",
    },
    {
      number: "102",
      floor: "1",
      sector: "A",
      roomKey: "room-102-key",
      label: "Habitación 102",
    },
    {
      number: "201",
      floor: "2",
      sector: "B",
      roomKey: "room-201-key",
      label: "Habitación 201",
    },
  ];

  await db.collection<Room>("rooms").deleteMany({});
  await db.collection<Room>("rooms").insertMany(rooms);

  const passwordHash = await hashPassword("admin123");
  const user: Omit<User, "_id"> = {
    email: "admin@hospital.com",
    passwordHash,
    name: "Administrador",
    createdAt: new Date(),
  };

  await db.collection<User>("users").deleteMany({});
  await db.collection<User>("users").insertOne(user);

  await db.collection("staff_sessions").deleteMany({});
  await db.collection("calls").deleteMany({});

  return NextResponse.json({
    message: "Datos de prueba creados",
    user: { email: user.email, password: "admin123" },
    rooms: rooms.map((r) => ({ label: r.label, roomKey: r.roomKey })),
  });
}

export async function GET() {
  const db = await getDb();
  const roomCount = await db.collection("rooms").countDocuments();
  const userCount = await db.collection("users").countDocuments();
  return NextResponse.json({ roomCount, userCount, seeded: roomCount > 0 });
}
