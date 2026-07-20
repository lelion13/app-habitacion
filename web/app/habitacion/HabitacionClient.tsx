"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bell, Video } from "lucide-react";
import type { CallTargetRole, CallType, StaffRole } from "@/lib/types";
import { CALL_TARGET_LABELS, CALL_TYPE_LABELS, ROLE_LABELS } from "@/lib/types";
import { VideoCallSession } from "@/components/VideoCallSession";
import { InstallRoomBanner } from "@/components/InstallRoomBanner";
import { RoomUnconfiguredScreen } from "@/components/RoomUnconfiguredScreen";
import { HabitacionHeader } from "@/components/habitacion/HabitacionHeader";
import { HabitacionCallButton } from "@/components/habitacion/HabitacionCallButton";
import { HabitacionCallModal } from "@/components/habitacion/HabitacionCallModal";
import { HabitacionFamilyInviteModal } from "@/components/habitacion/HabitacionFamilyInviteModal";
import { HabitacionToast } from "@/components/habitacion/HabitacionToast";
import {
  FAMILY_THEME,
  HABITACION_BG,
  HABITACION_BORDER,
  HABITACION_FG,
  HABITACION_MUTED,
  ROLE_THEME,
  visibleHabitacionRoles,
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
  active: boolean;
}

interface ActiveCall {
  id: string;
  type: CallType;
  targetRole: CallTargetRole;
  status: string;
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
  const [familyModalOpen, setFamilyModalOpen] = useState(false);
  const [familySubmitting, setFamilySubmitting] = useState(false);
  const [familyError, setFamilyError] = useState<string | null>(null);

  const roomQuery = roomKey ? `?key=${encodeURIComponent(roomKey)}` : "";
  const staffRoles = visibleHabitacionRoles();

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
    if (activeCall || !roomKey || (room && !room.active)) return;
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

  async function inviteFamily(email: string, message: string) {
    if (activeCall || !roomKey || (room && !room.active)) return;
    setFamilySubmitting(true);
    setFamilyError(null);
    setError(null);
    try {
      const res = await fetch("/api/calls/family-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomKey, email, message }),
      });
      const data = (await res.json()) as { error?: string; call?: ActiveCall };
      if (!res.ok) throw new Error(data.error ?? "Error al enviar invitación");
      setActiveCall(data.call ?? null);
      setFamilyModalOpen(false);
      setLastCall(`Invitación enviada a Familiar`);
    } catch (e) {
      setFamilyError(e instanceof Error ? e.message : "Error");
    } finally {
      setFamilySubmitting(false);
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
  const roomInactive = room !== null && !room.active;
  const showVideoSession =
    activeCall?.type === "video" && activeCall.status === "accepted";

  function buttonVisualState(
    role: CallTargetRole,
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
        <div className="habitacion-top min-h-0 px-1 pt-[max(0.5rem,env(safe-area-inset-top))] pb-1">
          <HabitacionHeader
            title={room!.label}
            subtitle={`Piso ${room!.floor} · Sector ${room!.sector}`}
          />

          <div className="mx-4 mt-2 h-px shrink-0" style={{ background: HABITACION_BORDER }} />

          <InstallRoomBanner roomReady={Boolean(room)} roomLabel={room?.label} />

          {roomInactive && (
            <div className="mx-4 mt-2 shrink-0 rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-3 text-center">
              <p className="text-sm font-bold text-amber-200">
                Esta habitación está inactiva
              </p>
              <p className="mt-1 text-xs font-semibold text-amber-100/80">
                No es posible realizar llamados. Contacte a administración.
              </p>
            </div>
          )}
        </div>

        <div className="habitacion-body">
          <div className="habitacion-sectors">
            {staffRoles.map((role) => {
              const theme = ROLE_THEME[role];
              const isActiveSector = activeCall?.targetRole === role;
              const sectionBg = isActiveSector ? theme.activeBgStyle : theme.bgStyle;

              return (
                <section
                  key={role}
                  className="relative flex min-h-0 flex-col rounded-2xl border px-2 py-1 transition-colors duration-300"
                  style={{
                    background: sectionBg,
                    borderColor: theme.borderStyle,
                  }}
                >
                  <div className="flex shrink-0 items-center justify-center gap-2 py-2">
                    <span
                      className={`text-4xl leading-none ${theme.textClass}`}
                      aria-hidden
                    >
                      {theme.icon}
                    </span>
                    <span
                      className={`text-center text-2xl font-black leading-tight ${theme.textClass}`}
                    >
                      {ROLE_LABELS[role]}
                    </span>
                  </div>

                  <div className="habitacion-call-row flex min-h-0 flex-1 items-center justify-center gap-2 pb-3">
                    <HabitacionCallButton
                      label="Timbre"
                      icon={<Bell size={28} strokeWidth={2.5} />}
                      ringColor={theme.ringColor}
                      visualState={buttonVisualState(role, "bell")}
                      disabled={
                        roomInactive ||
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
                      icon={<Video size={28} strokeWidth={2.5} />}
                      ringColor={theme.ringColor}
                      visualState={buttonVisualState(role, "video")}
                      disabled={
                        roomInactive ||
                        calling ||
                        (hasActiveCall &&
                          !(
                            activeCall?.targetRole === role &&
                            activeCall?.type === "video"
                          ))
                      }
                      onClick={() => void createCall("video", role)}
                    />
                  </div>
                </section>
              );
            })}

            <section
              className="relative flex min-h-0 flex-col rounded-2xl border px-2 py-1 transition-colors duration-300"
              style={{
                background:
                  activeCall?.targetRole === "family"
                    ? FAMILY_THEME.activeBgStyle
                    : FAMILY_THEME.bgStyle,
                borderColor: FAMILY_THEME.borderStyle,
              }}
            >
              <div className="flex shrink-0 items-center justify-center gap-2 py-2">
                <span
                  className={`text-4xl leading-none ${FAMILY_THEME.textClass}`}
                  aria-hidden
                >
                  {FAMILY_THEME.icon}
                </span>
                <span
                  className={`text-center text-2xl font-black leading-tight ${FAMILY_THEME.textClass}`}
                >
                  {CALL_TARGET_LABELS.family}
                </span>
              </div>

              <div className="habitacion-call-row flex min-h-0 flex-1 items-center justify-center pb-3">
                <HabitacionCallButton
                  label="Video"
                  icon={<Video size={28} strokeWidth={2.5} />}
                  ringColor={FAMILY_THEME.ringColor}
                  visualState={buttonVisualState("family", "video")}
                  fullWidth
                  disabled={
                    roomInactive ||
                    calling ||
                    familySubmitting ||
                    (hasActiveCall &&
                      !(
                        activeCall?.targetRole === "family" &&
                        activeCall?.type === "video"
                      ))
                  }
                  onClick={() => {
                    setFamilyError(null);
                    setFamilyModalOpen(true);
                  }}
                />
              </div>
            </section>
          </div>

          <p
            className="shrink-0 px-3 pt-3 pb-2 text-center text-base font-semibold"
            style={{ color: HABITACION_MUTED }}
          >
            Presione un botón para llamar al sector que necesita
          </p>
        </div>

        {hasActiveCall && !showVideoSession && activeCall && (
          <HabitacionCallModal
            open
            targetRole={activeCall.targetRole}
            callType={activeCall.type}
            status={activeCall.status}
            elapsedSeconds={callElapsed}
            cancelling={cancelling}
            onCancel={() => void cancelActiveCall()}
          />
        )}

        <HabitacionFamilyInviteModal
          open={familyModalOpen && !hasActiveCall}
          submitting={familySubmitting}
          error={familyError}
          onClose={() => {
            setFamilyModalOpen(false);
            setFamilyError(null);
          }}
          onSubmit={(email, message) => void inviteFamily(email, message)}
        />

        <HabitacionToast
          message={error}
          variant="error"
          onDismiss={() => setError(null)}
        />
        <HabitacionToast
          message={!hasActiveCall ? lastCall : null}
          variant="success"
          onDismiss={() => setLastCall(null)}
        />
      </div>
    </main>
  );
}
