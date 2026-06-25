import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { runAdminMigrations } from "@/lib/admin-migrate";
import { generateRoomKey } from "@/lib/room-key-gen";
import type { Floor, Room, Sector, User } from "@/lib/types";

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
  const now = new Date();

  await db.collection("floors").deleteMany({});
  await db.collection("sectors").deleteMany({});
  await db.collection("rooms").deleteMany({});

  const floors: Omit<Floor, "_id">[] = [
    { name: "1", label: "Piso 1", active: true, createdAt: now, updatedAt: now },
    { name: "2", label: "Piso 2", active: true, createdAt: now, updatedAt: now },
  ];
  const floor1Result = await db.collection<Floor>("floors").insertOne(floors[0] as Floor);
  const floor2Result = await db.collection<Floor>("floors").insertOne(floors[1] as Floor);
  const floor1 = { ...floors[0]!, _id: floor1Result.insertedId };
  const floor2 = { ...floors[1]!, _id: floor2Result.insertedId };

  const sectors: Omit<Sector, "_id">[] = [
    { code: "A", label: "Sector A", active: true, createdAt: now, updatedAt: now },
    { code: "B", label: "Sector B", active: true, createdAt: now, updatedAt: now },
  ];
  const sectorAResult = await db.collection<Sector>("sectors").insertOne(sectors[0] as Sector);
  const sectorBResult = await db.collection<Sector>("sectors").insertOne(sectors[1] as Sector);
  const sectorA = { ...sectors[0]!, _id: sectorAResult.insertedId };
  const sectorB = { ...sectors[1]!, _id: sectorBResult.insertedId };

  const rooms: Omit<Room, "_id">[] = [
    {
      number: "101",
      floorId: floor1._id,
      sectorId: sectorA._id,
      floor: "1",
      sector: "A",
      roomKey: "room-101-key",
      label: "Habitación 101",
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      number: "102",
      floorId: floor1._id,
      sectorId: sectorA._id,
      floor: "1",
      sector: "A",
      roomKey: "room-102-key",
      label: "Habitación 102",
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      number: "201",
      floorId: floor2._id,
      sectorId: sectorB._id,
      floor: "2",
      sector: "B",
      roomKey: "room-201-key",
      label: "Habitación 201",
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  await db.collection<Room>("rooms").insertMany(rooms as Room[]);

  const passwordHash = await hashPassword("admin123");
  const user: Omit<User, "_id"> = {
    email: "admin@hospital.com",
    passwordHash,
    name: "Administrador",
    systemRole: "admin",
    active: true,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection<User>("users").deleteMany({});
  await db.collection<User>("users").insertOne(user);

  await db.collection("staff_sessions").deleteMany({});
  await db.collection("calls").deleteMany({});

  return NextResponse.json({
    message: "Datos de prueba creados",
    user: { email: user.email, password: "admin123", systemRole: "admin" },
    rooms: rooms.map((r) => ({ label: r.label, roomKey: r.roomKey })),
    sampleGeneratedRoomKey: generateRoomKey(),
  });
}

export async function GET() {
  const db = await getDb();
  await runAdminMigrations(db);
  const rooms = await db.collection<Room>("rooms").find({}).toArray();
  return NextResponse.json({
    rooms: rooms.map((r) => ({
      label: r.label,
      roomKey: r.roomKey,
      active: r.active !== false,
    })),
  });
}
