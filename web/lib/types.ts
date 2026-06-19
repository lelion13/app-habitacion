import type { ObjectId } from "mongodb";

export type StaffRole = "nurse" | "quality" | "doctor";
export type CallType = "bell" | "video";
export type CallStatus = "pending" | "accepted" | "completed" | "cancelled";

export interface Room {
  _id?: ObjectId;
  number: string;
  floor: string;
  sector: string;
  roomKey: string;
  label: string;
}

export interface User {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
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
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  nurse: "Enfermería",
  quality: "Asistente de calidad",
  doctor: "Médico",
};

export const CALL_TYPE_LABELS: Record<CallType, string> = {
  bell: "Timbre",
  video: "Videollamada",
};
