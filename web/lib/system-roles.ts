import type { SystemRole } from "./types";

const ROLE_ORDER: Record<SystemRole, number> = {
  user: 0,
  supervisor: 1,
  admin: 2,
};

const SYSTEM_ROLES: SystemRole[] = ["user", "supervisor", "admin"];

export function isSystemRole(value: string): value is SystemRole {
  return SYSTEM_ROLES.includes(value as SystemRole);
}

export function normalizeSystemRole(role: string | undefined): SystemRole {
  if (role && isSystemRole(role)) return role;
  return "user";
}

export function hasAtLeastRole(
  userRole: SystemRole,
  minRole: SystemRole,
): boolean {
  return ROLE_ORDER[userRole] >= ROLE_ORDER[minRole];
}
