"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { StaffRole, CallType } from "@/lib/types";
import { ROLE_LABELS, CALL_TYPE_LABELS } from "@/lib/types";
import { RoleIcon, CallTypeIcon } from "@/components/RoleIcon";
import { PageHeader } from "@/components/PageHeader";

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

const STATUS_LABELS: Record<string, string> = {
  pending: "Esperando respuesta",
  accepted: "En atención",
};

function HabitacionContent() {
  const searchParams = useSearchParams();
  const roomKey = searchParams.get("key")?.trim() ?? "";

  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [lastCall, setLastCall] = useState<string | null>(null);

  const roomQuery = roomKey ? `?key=${encodeURIComponent(roomKey)}` : "";

  const loadActiveCall = useCallback(async () => {
    if (!roomKey) return;
    const res = await fetch(`/api/calls/room${roomQuery}`);
    if (!res.ok) return;
    const data = (await res.json()) as { call: ActiveCall | null };
    setActiveCall(data.call);
    if (!data.call) setError(null);
  }, [roomKey, roomQuery]);

  useEffect(() => {
    if (!roomKey) {
      setLoading(false);
      setError("Abra esta página con /habitacion?key=su-clave-de-habitación");
      return;
    }

    fetch(`/api/room${roomQuery}`)
      .then(async (res) => {
        const data = (await res.json()) as RoomInfo & { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Error");
        setRoom(data);
        return data.id;
      })
      .then(async () => {
        await loadActiveCall();
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [roomKey, roomQuery, loadActiveCall]);

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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">Cargando habitación…</p>
      </main>
    );
  }

  if (error && !room) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <p className="text-lg font-semibold text-red-600">{error}</p>
        <p className="mt-2 text-sm text-slate-600">
          Ejemplo: /habitacion?key=room-101-key
        </p>
      </main>
    );
  }

  const roles: StaffRole[] = ["nurse", "quality", "doctor"];
  const hasActiveCall = activeCall !== null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-teal-50 to-white px-4 py-8">
      <div className="mx-auto max-w-lg">
        <PageHeader
          title={room!.label}
          subtitle={`Piso ${room!.floor} · Sector ${room!.sector}`}
        />

        {activeCall && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <CallTypeIcon type={activeCall.type} />
              <div className="flex-1">
                <p className="font-semibold text-amber-900">Llamado activo</p>
                <p className="text-sm text-amber-800">
                  {CALL_TYPE_LABELS[activeCall.type]} a{" "}
                  {ROLE_LABELS[activeCall.targetRole]} ·{" "}
                  {STATUS_LABELS[activeCall.status] ?? activeCall.status}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={cancelActiveCall}
              disabled={cancelling}
              className="mt-3 w-full rounded-lg border border-amber-300 bg-white py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
            >
              {cancelling ? "Cancelando…" : "Cancelar llamado"}
            </button>
          </div>
        )}

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {lastCall && !hasActiveCall && (
          <p className="mb-4 rounded-lg bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">
            {lastCall}
          </p>
        )}

        <div className="space-y-6">
          {roles.map((role) => (
            <section
              key={role}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center gap-3">
                <RoleIcon role={role} size="lg" />
                <h2 className="text-xl font-bold text-slate-900">
                  {ROLE_LABELS[role]}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={calling || hasActiveCall}
                  onClick={() => createCall("bell", role)}
                  className="flex flex-col items-center gap-2 rounded-xl bg-orange-500 px-4 py-6 text-white transition hover:bg-orange-600 disabled:opacity-50"
                >
                  <CallTypeIcon type="bell" />
                  <span className="font-semibold">Timbre</span>
                </button>
                <button
                  type="button"
                  disabled={calling || hasActiveCall}
                  onClick={() => createCall("video", role)}
                  className="flex flex-col items-center gap-2 rounded-xl bg-violet-600 px-4 py-6 text-white transition hover:bg-violet-700 disabled:opacity-50"
                >
                  <CallTypeIcon type="video" />
                  <span className="font-semibold">Video</span>
                </button>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function HabitacionPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-slate-600">Cargando habitación…</p>
        </main>
      }
    >
      <HabitacionContent />
    </Suspense>
  );
}
