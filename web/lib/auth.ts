import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { AuthUser, SystemRole } from "./types";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  systemRole: SystemRole;
  scope?: "video-join" | "family-join";
  callId?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: AuthUser): string {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    systemRole: user.systemRole,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}

export function signVideoJoinToken(user: AuthUser, callId: string): string {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    systemRole: user.systemRole,
    scope: "video-join",
    callId,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });
}

/** JWT corto para familiar: sub = callId (sin usuario staff). */
export function signFamilyJoinToken(callId: string): string {
  const payload: JwtPayload = {
    sub: callId,
    email: "familiar@local",
    name: "Familiar",
    systemRole: "user",
    scope: "family-join",
    callId,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "3h" });
}

export function isVideoJoinPayload(payload: JwtPayload): boolean {
  return payload.scope === "video-join" && Boolean(payload.callId);
}

export function isFamilyJoinPayload(payload: JwtPayload): boolean {
  return payload.scope === "family-join" && Boolean(payload.callId);
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function getBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}
