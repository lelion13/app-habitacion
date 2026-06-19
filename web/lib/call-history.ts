import type { CallStatus, CallType, StaffRole } from "./types";
import { isCallType, isStaffRole } from "./validation";

export interface HistoryFilters {
  from: Date;
  to: Date;
  floor?: string;
  sector?: string;
  targetRole?: StaffRole;
  roomNumber?: string;
  type?: CallType;
  status?: CallStatus;
  page: number;
  limit: number;
}

const TERMINAL: CallStatus[] = ["completed", "cancelled"];
const ALL_STATUSES: CallStatus[] = [
  "pending",
  "accepted",
  "completed",
  "cancelled",
];

export function parseHistoryParams(
  searchParams: URLSearchParams,
): HistoryFilters | { error: string } {
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 7);

  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");
  const from = fromStr ? new Date(fromStr) : defaultFrom;
  const to = toStr ? new Date(toStr) : now;

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return { error: "Fechas inválidas" };
  }

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20),
  );

  const typeParam = searchParams.get("type") ?? "";
  const roleParam = searchParams.get("targetRole") ?? "";
  const statusParam = searchParams.get("status") ?? "";

  if (typeParam && !isCallType(typeParam)) {
    return { error: "Tipo inválido" };
  }
  if (roleParam && !isStaffRole(roleParam)) {
    return { error: "Rol inválido" };
  }
  if (statusParam && !ALL_STATUSES.includes(statusParam as CallStatus)) {
    return { error: "Estado inválido" };
  }

  return {
    from,
    to,
    floor: searchParams.get("floor")?.trim() || undefined,
    sector: searchParams.get("sector")?.trim() || undefined,
    targetRole: roleParam ? (roleParam as StaffRole) : undefined,
    roomNumber: searchParams.get("roomNumber")?.trim() || undefined,
    type: typeParam ? (typeParam as CallType) : undefined,
    status: statusParam ? (statusParam as CallStatus) : undefined,
    page,
    limit,
  };
}

export function buildHistoryMatch(
  filters: HistoryFilters,
): Record<string, unknown> {
  const match: Record<string, unknown> = {
    createdAt: { $gte: filters.from, $lte: filters.to },
  };
  if (filters.floor) match.floor = filters.floor;
  if (filters.sector) match.sector = filters.sector;
  if (filters.targetRole) match.targetRole = filters.targetRole;
  if (filters.roomNumber) match.roomNumber = filters.roomNumber;
  if (filters.type) match.type = filters.type;
  if (filters.status) match.status = filters.status;
  return match;
}

export function roundAvg(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) return null;
  return Math.round(value);
}

export { TERMINAL, ALL_STATUSES };
