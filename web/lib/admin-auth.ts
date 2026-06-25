import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getBearerToken, verifyToken } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  hasAtLeastRole,
  isSystemRole,
  normalizeSystemRole,
} from "@/lib/system-roles";
import type { SystemRole, User } from "@/lib/types";
import { isUserActive } from "@/lib/types";

export { hasAtLeastRole, isSystemRole, normalizeSystemRole } from "@/lib/system-roles";

export function toAuthUser(user: User) {
  return {
    id: user._id!.toString(),
    email: user.email,
    name: user.name,
    systemRole: normalizeSystemRole(user.systemRole),
  };
}

export async function getUserById(id: string): Promise<User | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  return db.collection<User>("users").findOne({ _id: new ObjectId(id) });
}

export async function getAuthUserFromRequest(
  request: NextRequest,
): Promise<User | null> {
  const token = getBearerToken(request.headers.get("authorization"));
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await getUserById(payload.sub);
  if (!user || !isUserActive(user)) return null;
  return user;
}

type AuthResult =
  | { user: User }
  | { error: NextResponse };

async function requireRole(
  request: NextRequest,
  minRole: SystemRole,
): Promise<AuthResult> {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return {
      error: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    };
  }

  const role = normalizeSystemRole(user.systemRole);
  if (!hasAtLeastRole(role, minRole)) {
    return {
      error: NextResponse.json({ error: "Sin permisos" }, { status: 403 }),
    };
  }

  return { user };
}

export function requireAdmin(request: NextRequest) {
  return requireRole(request, "admin");
}

export function requireSupervisor(request: NextRequest) {
  return requireRole(request, "supervisor");
}

export function isAuthError(
  result: AuthResult,
): result is { error: NextResponse } {
  return "error" in result;
}
