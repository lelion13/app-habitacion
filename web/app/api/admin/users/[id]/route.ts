import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { isAuthError, requireAdmin } from "@/lib/admin-auth";
import { serializeAdminUser } from "@/lib/admin-migrate";
import { normalizeSystemRole } from "@/lib/system-roles";
import {
  validateNonEmpty,
  validatePassword,
  validateSystemRole,
} from "@/lib/validation";
import type { User } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function countActiveAdmins(db: Awaited<ReturnType<typeof getDb>>, excludeId?: ObjectId) {
  const filter: Record<string, unknown> = {
    systemRole: "admin",
    active: { $ne: false },
  };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  return db.collection<User>("users").countDocuments(filter);
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin(request);
  if (isAuthError(auth)) return auth.error;

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const db = await getDb();
  const user = await db.collection<User>("users").findOne({ _id: new ObjectId(id) });
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ user: serializeAdminUser(user) });
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
      systemRole?: string;
      active?: boolean;
      password?: string;
    };

    const db = await getDb();
    const userId = new ObjectId(id);
    const user = await db.collection<User>("users").findOne({ _id: userId });
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const updates: Partial<User> = { updatedAt: new Date() };

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!validateNonEmpty(name)) {
        return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
      }
      updates.name = name;
    }

    if (body.systemRole !== undefined) {
      if (!validateSystemRole(body.systemRole)) {
        return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
      }
      updates.systemRole = body.systemRole;
    }

    if (body.active !== undefined) {
      const nextActive = Boolean(body.active);
      const role = normalizeSystemRole(updates.systemRole ?? user.systemRole);
      if (!nextActive && role === "admin") {
        const otherAdmins = await countActiveAdmins(db, userId);
        if (otherAdmins === 0) {
          return NextResponse.json(
            { error: "Debe haber al menos un administrador activo" },
            { status: 409 },
          );
        }
      }
      updates.active = nextActive;
    }

    if (body.password !== undefined && body.password.length > 0) {
      if (!validatePassword(body.password)) {
        return NextResponse.json(
          { error: "La contraseña debe tener al menos 6 caracteres" },
          { status: 400 },
        );
      }
      updates.passwordHash = await hashPassword(body.password);
    }

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
    }

    await db.collection<User>("users").updateOne({ _id: userId }, { $set: updates });
    const updated = await db.collection<User>("users").findOne({ _id: userId });
    return NextResponse.json({ user: serializeAdminUser(updated!) });
  } catch {
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
  }
}
