import type { CallType, ListenConfig, StaffRole, SystemRole } from "./types";
import { isSystemRole } from "./system-roles";

const STAFF_ROLES: StaffRole[] = ["nurse", "quality", "doctor"];
const CALL_TYPES: CallType[] = ["bell", "video"];

export function isStaffRole(value: string): value is StaffRole {
  return STAFF_ROLES.includes(value as StaffRole);
}

export function isCallType(value: string): value is CallType {
  return CALL_TYPES.includes(value as CallType);
}

export function validateListenConfig(
  data: Partial<ListenConfig>,
): data is ListenConfig {
  return (
    typeof data.floor === "string" &&
    data.floor.trim().length > 0 &&
    typeof data.sector === "string" &&
    data.sector.trim().length > 0 &&
    typeof data.role === "string" &&
    isStaffRole(data.role)
  );
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 6;
}

export function validateSystemRole(value: string): value is SystemRole {
  return isSystemRole(value);
}

export function validateNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

export function listenKey(config: ListenConfig): string {
  return `${config.floor}:${config.sector}:${config.role}`;
}
