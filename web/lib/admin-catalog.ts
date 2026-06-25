import type { Db, ObjectId } from "mongodb";
import type { Floor, Room, Sector } from "./types";
import { isRoomActive } from "./types";

export async function resolveFloorSectorDenorm(
  db: Db,
  floorId: ObjectId,
  sectorId: ObjectId,
): Promise<{ floor: Floor; sector: Sector; floorName: string; sectorCode: string }> {
  const [floor, sector] = await Promise.all([
    db.collection<Floor>("floors").findOne({ _id: floorId }),
    db.collection<Sector>("sectors").findOne({ _id: sectorId }),
  ]);

  if (!floor) {
    throw new Error("Piso no encontrado");
  }
  if (!sector) {
    throw new Error("Sector no encontrado");
  }
  if (!floor.active) {
    throw new Error("El piso seleccionado está inactivo");
  }
  if (!sector.active) {
    throw new Error("El sector seleccionado está inactivo");
  }

  return {
    floor,
    sector,
    floorName: floor.name.trim(),
    sectorCode: sector.code.trim(),
  };
}

export async function countActiveRoomsForFloor(
  db: Db,
  floorId: ObjectId,
): Promise<number> {
  return db.collection<Room>("rooms").countDocuments({
    floorId,
    active: { $ne: false },
  });
}

export async function countActiveRoomsForSector(
  db: Db,
  sectorId: ObjectId,
): Promise<number> {
  return db.collection<Room>("rooms").countDocuments({
    sectorId,
    active: { $ne: false },
  });
}

export function roomIsCallable(room: Room): boolean {
  return isRoomActive(room);
}
