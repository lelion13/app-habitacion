import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { isAuthError, requireAdmin } from "@/lib/admin-auth";
import { serializeAdminUser } from "@/lib/admin-migrate";
import { validateEmail, validateNonEmpty, validatePassword, validateSystemRole } from "@/lib/validation";
import type { User } from "@/lib/types";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (isAuthError(auth)) return auth.error;

  const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";
  const db = await getDb();
  const filter = includeInactive ? {} : { active: { $ne: false } };

  const users = await db
    .collection<User>("users")
    .find(filter)
    .sort({ name: 1 })
    .toArray();

  return NextResponse.json({ users: users.map(serializeAdminUser) });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (isAuthError(auth)) return auth.error;

  try {
    const body = (await request.json()) as {
      email?: string;
      name?: string;
      password?: string;
      systemRole?: string;
    };

    const email = body.email?.trim().toLowerCase() ?? "";
    const name = body.name?.trim() ?? "";
    const password = body.password ?? "";
    const systemRole = body.systemRole ?? "user";

    if (
      !validateEmail(email) ||
      !validateNonEmpty(name) ||
      !validatePassword(password) ||
      !validateSystemRole(systemRole)
    ) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.collection<User>("users").findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }

    const now = new Date();
    const user: Omit<User, "_id"> = {
      email,
      name,
      passwordHash: await hashPassword(password),
      systemRole,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<User>("users").insertOne(user as User);
    return NextResponse.json(
      { user: serializeAdminUser({ ...user, _id: result.insertedId }) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
  }
}
