import type { ObjectId } from "mongodb";

export type StaffRole = "nurse" | "quality" | "doctor";
export type SystemRole = "user" | "supervisor" | "admin";
export type CallType = "bell" | "video";
export type CallStatus = "pending" | "accepted" | "completed" | "cancelled";

export interface Floor {
  _id?: ObjectId;
  name: string;
  label: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sector {
  _id?: ObjectId;
  code: string;
  label: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Room {
  _id?: ObjectId;
  number: string;
  floorId?: ObjectId;
  sectorId?: ObjectId;
  floor: string;
  sector: string;
  roomKey: string;
  label: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  systemRole: SystemRole;
  active: boolean;
  createdAt: Date;
  updatedAt?: Date;
  telegramChatId?: string;
  telegramUsername?: string;
  telegramLinkedAt?: Date;
  telegramNotifyEnabled?: boolean;
}

export interface TelegramLinkToken {
  _id?: ObjectId;
  token: string;
  userId: ObjectId;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

export interface TelegramVideoJoinToken {
  _id?: ObjectId;
  token: string;
  callId: ObjectId;
  userId: ObjectId;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

export interface CallTelegramAlert {
  userId: ObjectId;
  chatId: string;
  messageId: number;
}

export interface StaffSession {
  _id?: ObjectId;
  userId: ObjectId;
  floor: string;
  sector: string;
  role: StaffRole;
  active: boolean;
  updatedAt: Date;
}

export interface Call {
  _id?: ObjectId;
  roomId: ObjectId;
  roomNumber: string;
  floor: string;
  sector: string;
  type: CallType;
  targetRole: StaffRole;
  status: CallStatus;
  createdAt: Date;
  acceptedBy?: ObjectId;
  acceptedAt?: Date;
  completedAt?: Date;
  responseTimeMs?: number;
  totalDurationMs?: number;
  sessionDurationMs?: number;
  signalData?: {
    offer?: string;
    answer?: string;
    iceCandidates?: string[];
  };
  telegramAlerts?: CallTelegramAlert[];
}

export interface ListenConfig {
  floor: string;
  sector: string;
  role: StaffRole;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  systemRole: SystemRole;
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  nurse: "Enfermería",
  quality: "Asistente de calidad",
  doctor: "Médico",
};

export const SYSTEM_ROLE_LABELS: Record<SystemRole, string> = {
  user: "Usuario",
  supervisor: "Supervisor",
  admin: "Administrador",
};

export const CALL_TYPE_LABELS: Record<CallType, string> = {
  bell: "Timbre",
  video: "Videollamada",
};

export function isUserActive(user: Pick<User, "active">): boolean {
  return user.active !== false;
}

export function isRoomActive(room: Pick<Room, "active">): boolean {
  return room.active !== false;
}
