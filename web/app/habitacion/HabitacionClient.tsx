"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bell, Video, X, Phone, CheckCircle } from "lucide-react";
import type { StaffRole, CallType } from "@/lib/types";
import { ROLE_LABELS, CALL_TYPE_LABELS } from "@/lib/types";
import { VideoCallSession } from "@/components/VideoCallSession";
import { InstallRoomBanner } from "@/components/InstallRoomBanner";
import { RoomUnconfiguredScreen } from "@/components/RoomUnconfiguredScreen";
import { HabitacionHeader } from "@/components/habitacion/HabitacionHeader";
import { HabitacionCallButton } from "@/components/habitacion/HabitacionCallButton";
import {
  HABITACION_BG,
  HABITACION_BORDER,
  HABITACION_FG,
  HABITACION_MUTED,
  ROLE_THEME,
} from "@/lib/habitacion-theme";
import {
  clearStoredRoomKey,
  markPwaInstalled,
  pickRoomKeyCandidate,
  readStoredRoomKey,
  setDynamicManifestLink,
  writeStoredRoomKey,
} from "@/lib/room-bind";
import { registerServiceWorker } from "@/lib/register-service-worker";

interface RoomInfo {
  id: string;
  number: string;
  floor: string;
  sector: string;
  label: string;
}

interface ActiveCall {
  id: string;
  type: CallType;
  targetRole: StaffRole;
  status: string;
}

const ROLES: StaffRole[] = ["nurse", "quality", "doctor"];

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function HabitacionLoading() {
  return (
    <main
      className="flex h-full items-center justify-center"
      style={{ background: HABITACION_BG, color: HABITACION_MUTED }}
    >
      <p className="font-semibold">Cargando habitación…</p>
    </main>
  );
}

export function HabitacionClient() {
  const searchParams = useSearchParams();
  const urlKey = searchParams.get("key")?.trim() ?? "";

  const [roomKey, setRoomKey] = useState("");
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [unconfigured, setUnconfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [lastCall, setLastCall] = useState<string | null>(null);
  const [callElapsed, setCallElapsed] = useState(0);

  const roomQuery = roomKey ? `?key=${encodeURIComponent(roomKey)}` : "";

  useEffect(() => {
    registerServiceWorker();

    const onInstalled = () => markPwaInstalled();
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  useEffect(() => {
    const storedKey = readStoredRoomKey();
    const candidateKey = pickRoomKeyCandidate(urlKey, storedKey);

    if (!candidateKey) {
      setRoom(null);
      setRoomKey("");
      setUnconfigured(true);
      setError(null);
      setLoading(false);
      return;
    }

    setUnconfigured(false);
    setLoading(true);
    setError(null);

    const query = `?key=${encodeURIComponent(candidateKey)}`;
    let cancelled = false;

    fetch(`/api/room${query}`)
      .then(async (res) => {
        const data = (await res.json()) as RoomInfo & { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Error");
        if (cancelled) return;
        writeStoredRoomKey(candidateKey);
        setDynamicManifestLink(candidateKey);
        setRoomKey(candidateKey);
        setRoom(data);

        const callRes = await fetch(`/api/calls/room${query}`);
        if (!callRes.ok || cancelled) return;
        const callData = (await callRes.json()) as { call: ActiveCall | null };
        setActiveCall(callData.call);
      })
      .catch(() => {
        if (cancelled) return;
        setRoom(null);
        setRoomKey("");
        if (!urlKey && storedKey) {
          clearStoredRoomKey();
        }
        setUnconfigured(true);
        setError(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [urlKey]);

  useEffect(() => {
    if (!room) return;

    const source = new EventSource(
      `/api/calls/room/stream?roomId=${encodeURIComponent(room.id)}`,
    );

    source.addEventListener("call:new", (event) => {
      const call = JSON.parse(event.data) as ActiveCall;
      setActiveCall(call);
      setError(null);
    });

    source.addEventListener("call:updated", (event) => {
      const call = JSON.parse(event.data) as ActiveCall;
      if (call.status === "completed" || call.status === "cancelled") {
        setActiveCall(null);
        setError(null);
      } else {
        setActiveCall(call);
      }
    });

    return () => source.close();
  }, [room]);

  useEffect(() => {
    if (!activeCall) {
      setCallElapsed(0);
      return;
    }

    setCallElapsed(0);
    const id = window.setInterval(() => setCallElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [activeCall?.id, activeCall?.status]);

  async function createCall(type: CallType, targetRole: StaffRole) {
    if (activeCall || !roomKey) return;
    setCalling(true);
    setLastCall(null);
    setError(null);
    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomKey, type, targetRole }),
      });
      const data = (await res.json()) as { error?: string; call?: ActiveCall };
      if (!res.ok) throw new Error(data.error ?? "Error al llamar");
      setActiveCall(data.call ?? null);
      setLastCall(`${CALL_TYPE_LABELS[type]} enviado a ${ROLE_LABELS[targetRole]}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setCalling(false);
    }
  }

  async function cancelActiveCall() {
    if (!roomKey) return;
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch(`/api/calls/room${roomQuery}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", roomKey }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Error al cancelar");
      setActiveCall(null);
      setLastCall(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <HabitacionLoading />;
  if (unconfigured) return <RoomUnconfiguredScreen />;

  const hasActiveCall = activeCall !== null;
  const showVideoSession =
    activeCall?.type === "video" && activeCall.status === "accepted";

  function buttonVisualState(
    role: StaffRole,
    type: CallType,
  ): "idle" | "calling" | "connected" {
    if (!activeCall || activeCall.targetRole !== role || activeCall.type !== type) {
      return "idle";
    }
    if (activeCall.status === "accepted") return "connected";
    return "calling";
  }

  return (
    <main
      className="flex h-full flex-col overflow-hidden"
      style={{ background: HABITACION_BG, color: HABITACION_FG }}
    >
      {showVideoSession && room && (
        <VideoCallSession
          callId={activeCall.id}
          role="room"
          roomKey={roomKey}
          roomId={room.id}
          fullscreen
          shellVariant="habitacion"
          onEnded={() => setActiveCall(null)}
        />
      )}

      <div
        className={
          showVideoSession
            ? "hidden"
            : "flex h-full min-h-0 flex-col overflow-hidden"
        }
      >
        <HabitacionHeader
          title={room!.label}
          subtitle={`Piso ${room!.floor} · Sector ${room!.sector}`}
        />

        <div className="mx-3 h-px shrink-0 sm:mx-4" style={{ background: HABITACION_BORDER }} />

        <InstallRoomBanner roomReady={Boolean(room)} roomLabel={room?.label} />

        <p
          className="shrink-0 px-3 py-0.5 text-center text-xs font-semibold sm:text-sm"
          style={{ color: HABITACION_MUTED }}
        >
          Presione un botón para llamar al sector que necesita
        </p>

        {error && (
          <p className="mx-3 mb-0.5 shrink-0 truncate rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-300">
            {error}
          </p>
        )}
        {lastCall && !hasActiveCall && (
          <p className="mx-3 mb-0.5 shrink-0 truncate rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            {lastCall}
          </p>
        )}

        <div className="grid min-h-0 flex-1 grid-rows-3 gap-1 px-2 pb-1 sm:gap-1.5 sm:px-3">
          {ROLES.map((role) => {
            const theme = ROLE_THEME[role];
            const isActiveSector = activeCall?.targetRole === role;
            const callState = isActiveSector ? activeCall?.status : null;

            return (
              <section
                key={role}
                className={`relative grid min-h-0 grid-rows-[auto_minmax(0,1fr)] grid-cols-2 gap-x-2 gap-y-0.5 rounded-xl border px-2 pb-2 pt-1 transition-all duration-300 sm:gap-x-3 sm:rounded-2xl sm:pb-2 ${theme.bgClass} ${theme.borderClass} ${
                  isActiveSector ? theme.activeBgClass : ""
                }`}
              >
                <div className="relative col-span-2 flex items-center justify-center gap-1.5 py-0.5">
                  <span
                    className={`text-2xl leading-none sm:text-[1.75rem] ${theme.textClass}`}
                    aria-hidden
                  >
                    {theme.icon}
                  </span>
                  <span
                    className={`text-center text-base font-black leading-tight sm:text-lg ${theme.textClass}`}
                  >
                    {ROLE_LABELS[role]}
                  </span>

                  {isActiveSector && callState === "accepted" && (
                    <span className="absolute right-0 flex items-center gap-1 text-[0.6rem] font-bold text-emerald-400 sm:text-[0.65rem]">
                      <CheckCircle size={12} />
                      <span className="hidden min-[480px]:inline">En atención · </span>
                      {formatElapsed(callElapsed)}
                    </span>
                  )}
                  {isActiveSector && callState === "pending" && (
                    <span className="absolute right-0 flex animate-pulse items-center gap-1 text-[0.6rem] font-bold text-amber-400 sm:text-[0.65rem]">
                      <Phone size={12} />
                      Llamando...
                    </span>
                  )}
                </div>

                <HabitacionCallButton
                  label="Timbre"
                  icon={<Bell size={20} strokeWidth={2.5} className="sm:h-6 sm:w-6" />}
                  ringColor={theme.ringColor}
                  visualState={buttonVisualState(role, "bell")}
                  disabled={
                    calling ||
                    (hasActiveCall &&
                      !(
                        activeCall?.targetRole === role &&
                        activeCall?.type === "bell"
                      ))
                  }
                  onClick={() => void createCall("bell", role)}
                />
                <HabitacionCallButton
                  label="Video"
                  icon={<Video size={20} strokeWidth={2.5} className="sm:h-6 sm:w-6" />}
                  ringColor={theme.ringColor}
                  visualState={buttonVisualState(role, "video")}
                  disabled={
                    calling ||
                    (hasActiveCall &&
                      !(
                        activeCall?.targetRole === role &&
                        activeCall?.type === "video"
                      ))
                  }
                  onClick={() => void createCall("video", role)}
                />
              </section>
            );
          })}
        </div>

        {hasActiveCall && !showVideoSession && (
          <footer className="shrink-0 px-3 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4">
            <button
              type="button"
              onClick={() => void cancelActiveCall()}
              disabled={cancelling}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-black text-white shadow-lg transition-all duration-150 active:scale-[0.98] disabled:opacity-50 sm:rounded-2xl sm:py-3 sm:text-base"
              style={{ background: "#ef4444" }}
            >
              <X size={20} strokeWidth={3} />
              {cancelling ? "Cancelando…" : "Cancelar llamada"}
            </button>
          </footer>
        )}
      </div>
    </main>
  );
}
