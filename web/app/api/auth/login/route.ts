import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import {
  getBearerToken,
  signToken,
  verifyPassword,
  verifyToken,
} from "@/lib/auth";
import { toAuthUser } from "@/lib/admin-auth";
import { runAdminMigrations } from "@/lib/admin-migrate";
import { normalizeSystemRole } from "@/lib/system-roles";
import { validateEmail, validatePassword } from "@/lib/validation";
import type { User } from "@/lib/types";
import { isUserActive } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!validateEmail(email) || !validatePassword(password)) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 400 },
      );
    }

    const db = await getDb();
    await runAdminMigrations(db);

    const user = await db.collection<User>("users").findOne({ email });

    if (
      !user ||
      !isUserActive(user) ||
      !(await verifyPassword(password, user.passwordHash))
    ) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 },
      );
    }

    const authUser = toAuthUser({
      ...user,
      systemRole: normalizeSystemRole(user.systemRole),
    });
    const token = signToken(authUser);

    return NextResponse.json({
      token,
      user: authUser,
    });
  } catch {
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const token = getBearerToken(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const db = await getDb();
  await runAdminMigrations(db);

  const user = await db
    .collection<User>("users")
    .findOne({ _id: new ObjectId(payload.sub) });

  if (!user || !isUserActive(user)) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    user: toAuthUser(user),
  });
}
