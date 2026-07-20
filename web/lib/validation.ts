import type { CallTargetRole, CallType, ListenConfig, StaffRole, SystemRole } from "./types";
import { isSystemRole } from "./system-roles";

const STAFF_ROLES: StaffRole[] = ["nurse", "quality", "doctor"];
const CALL_TARGET_ROLES: CallTargetRole[] = [...STAFF_ROLES, "family"];
const CALL_TYPES: CallType[] = ["bell", "video"];

/** Email estricto: local@dominio.tld */
const STRICT_EMAIL =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isStaffRole(value: string): value is StaffRole {
  return STAFF_ROLES.includes(value as StaffRole);
}

export function isCallTargetRole(value: string): value is CallTargetRole {
  return CALL_TARGET_ROLES.includes(value as CallTargetRole);
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
  return STRICT_EMAIL.test(email.trim());
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
