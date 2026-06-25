import type { Db } from "mongodb";
import type { Floor, Room, Sector, User } from "./types";
import { normalizeSystemRole } from "./system-roles";

export async function ensureAdminCatalogMigrated(db: Db): Promise<void> {
  const rooms = await db.collection<Room>("rooms").find({}).toArray();
  if (rooms.length === 0) return;

  const needsFloorIds = rooms.some((room) => !room.floorId || !room.sectorId);
  if (!needsFloorIds) return;

  const floorMap = new Map<string, Floor>();
  const sectorMap = new Map<string, Sector>();
  const now = new Date();

  for (const room of rooms) {
    const floorKey = room.floor?.trim() ?? "";
    const sectorKey = room.sector?.trim() ?? "";
    if (!floorKey || !sectorKey) continue;

    if (!floorMap.has(floorKey)) {
      const existing = await db
        .collection<Floor>("floors")
        .findOne({ name: floorKey });
      if (existing) {
        floorMap.set(floorKey, existing);
      } else {
        const doc: Omit<Floor, "_id"> = {
          name: floorKey,
          label: `Piso ${floorKey}`,
          active: true,
          createdAt: now,
          updatedAt: now,
        };
        const result = await db.collection<Floor>("floors").insertOne(doc as Floor);
        floorMap.set(floorKey, { ...doc, _id: result.insertedId });
      }
    }

    if (!sectorMap.has(sectorKey)) {
      const existing = await db
        .collection<Sector>("sectors")
        .findOne({ code: sectorKey });
      if (existing) {
        sectorMap.set(sectorKey, existing);
      } else {
        const doc: Omit<Sector, "_id"> = {
          code: sectorKey,
          label: `Sector ${sectorKey}`,
          active: true,
          createdAt: now,
          updatedAt: now,
        };
        const result = await db.collection<Sector>("sectors").insertOne(doc as Sector);
        sectorMap.set(sectorKey, { ...doc, _id: result.insertedId });
      }
    }
  }

  for (const room of rooms) {
    const floorKey = room.floor?.trim() ?? "";
    const sectorKey = room.sector?.trim() ?? "";
    const floor = floorMap.get(floorKey);
    const sector = sectorMap.get(sectorKey);
    if (!floor?._id || !sector?._id) continue;

    await db.collection<Room>("rooms").updateOne(
      { _id: room._id },
      {
        $set: {
          floorId: floor._id,
          sectorId: sector._id,
          active: room.active !== false,
          updatedAt: now,
        },
      },
    );
  }
}

export async function ensureUserRolesMigrated(db: Db): Promise<void> {
  const users = await db.collection<User>("users").find({}).toArray();
  const now = new Date();

  for (const user of users) {
    const updates: Partial<User> = {};
    if (!user.systemRole) {
      updates.systemRole =
        user.email === "admin@hospital.com" ? "admin" : "user";
    }
    if (user.active === undefined) {
      updates.active = true;
    }
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = now;
      await db.collection<User>("users").updateOne(
        { _id: user._id },
        { $set: updates },
      );
    }
  }

  const adminCount = await db.collection<User>("users").countDocuments({
    systemRole: "admin",
    active: { $ne: false },
  });
  if (adminCount === 0 && users.length > 0) {
    const first = users[0];
    await db.collection<User>("users").updateOne(
      { _id: first._id },
      { $set: { systemRole: "admin", active: true, updatedAt: now } },
    );
  }
}

export async function runAdminMigrations(db: Db): Promise<void> {
  await ensureAdminCatalogMigrated(db);
  await ensureUserRolesMigrated(db);
}

export function serializeFloor(floor: Floor) {
  return {
    id: floor._id!.toString(),
    name: floor.name,
    label: floor.label,
    active: floor.active !== false,
    createdAt: floor.createdAt.toISOString(),
    updatedAt: floor.updatedAt.toISOString(),
  };
}

export function serializeSector(sector: Sector) {
  return {
    id: sector._id!.toString(),
    code: sector.code,
    label: sector.label,
    active: sector.active !== false,
    createdAt: sector.createdAt.toISOString(),
    updatedAt: sector.updatedAt.toISOString(),
  };
}

export function serializeAdminRoom(room: Room) {
  return {
    id: room._id!.toString(),
    number: room.number,
    label: room.label,
    roomKey: room.roomKey,
    floorId: room.floorId?.toString() ?? null,
    sectorId: room.sectorId?.toString() ?? null,
    floor: room.floor,
    sector: room.sector,
    active: room.active !== false,
    createdAt: room.createdAt?.toISOString() ?? null,
    updatedAt: room.updatedAt?.toISOString() ?? null,
  };
}

export function serializeAdminUser(user: User) {
  return {
    id: user._id!.toString(),
    email: user.email,
    name: user.name,
    systemRole: normalizeSystemRole(user.systemRole),
    active: user.active !== false,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt?.toISOString() ?? null,
  };
}
