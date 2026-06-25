"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/PageHeader";
import { RoleIcon, CallTypeIcon } from "@/components/RoleIcon";
import {
  playBell,
  playVideoAlert,
  stopAlertLoop,
  syncAlertLoop,
} from "@/lib/bell";
import { enableAlertAudio, wasAudioUnlockedThisSession } from "@/lib/audio-alert-session";
import { matchesListenTarget, resolveAlertKind } from "@/lib/calls";
import {
  ROLE_LABELS,
  CALL_TYPE_LABELS,
  type StaffRole,
  type CallType,
  type CallStatus,
} from "@/lib/types";
import {
  staffAlert,
  staffBtnDanger,
  staffBtnGhost,
  staffBtnPrimary,
  staffBtnSecondary,
  staffCard,
  staffContent,
  staffEmpty,
  staffError,
  staffInput,
  staffLabel,
  staffSuccess,
  staffText,
} from "@/lib/staff-theme";

interface SerializedCall {
  id: string;
  roomNumber: string;
  floor: string;
  sector: string;
  type: CallType;
  targetRole: StaffRole;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { token, listenConfig, saveListenConfig, clearListenConfig, setListening } = useApp();
  const [floor, setFloor] = useState(listenConfig?.floor ?? "1");
  const [sector, setSector] = useState(listenConfig?.sector ?? "A");
  const [role, setRole] = useState<StaffRole>(listenConfig?.role ?? "nurse");
  const [calls, setCalls] = useState<SerializedCall[]>([]);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioReady, setAudioReady] = useState(false);

  const pendingForListen = useMemo(() => {
    if (!listenConfig) return [];
    return calls.filter((call) =>
      matchesListenTarget(
        {
          floor: call.floor,
          sector: call.sector,
          targetRole: call.targetRole,
          status: call.status as CallStatus,
        },
        listenConfig.floor,
        listenConfig.sector,
        listenConfig.role,
      ),
    );
  }, [calls, listenConfig]);

  const loadCalls = useCallback(async () => {
    if (!token || !listenConfig) return;
    const params = new URLSearchParams({
      floor: listenConfig.floor,
      sector: listenConfig.sector,
      role: listenConfig.role,
    });
    const res = await fetch(`/api/calls?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = (await res.json()) as { calls: SerializedCall[] };
    setCalls(data.calls);
  }, [token, listenConfig]);

  useEffect(() => {
    if (listenConfig) {
      setFloor(listenConfig.floor);
      setSector(listenConfig.sector);
      setRole(listenConfig.role);
      void loadCalls();
    }
  }, [listenConfig, loadCalls]);

  useEffect(() => {
    if (!token || !listenConfig) return;

    const poll = window.setInterval(() => {
      void loadCalls();
    }, 4000);

    return () => window.clearInterval(poll);
  }, [token, listenConfig, loadCalls]);

  useEffect(() => {
    if (!token || !listenConfig) return;

    const params = new URLSearchParams({
      floor: listenConfig.floor,
      sector: listenConfig.sector,
      role: listenConfig.role,
    });

    const source = new EventSource(
      `/api/calls/stream?${params.toString()}&token=${encodeURIComponent(token)}`,
    );

    setListening(true);

    source.addEventListener("call:new", (event) => {
      const call = JSON.parse(event.data) as SerializedCall;
      setCalls((prev) => [call, ...prev.filter((c) => c.id !== call.id)]);
    });

    source.addEventListener("call:updated", (event) => {
      const call = JSON.parse(event.data) as SerializedCall;
      setCalls((prev) =>
        call.status === "completed" || call.status === "cancelled"
          ? prev.filter((c) => c.id !== call.id)
          : prev.map((c) => (c.id === call.id ? call : c)),
      );
    });

    return () => {
      source.close();
      setListening(false);
    };
  }, [token, listenConfig, setListening]);

  useEffect(() => {
    if (!audioReady || pendingForListen.length === 0) {
      syncAlertLoop(null);
      return;
    }
    syncAlertLoop(resolveAlertKind(pendingForListen));
    return () => stopAlertLoop();
  }, [audioReady, pendingForListen]);

  useEffect(() => {
    if (!listenConfig || audioReady || pendingForListen.length === 0) return;
    if (!wasAudioUnlockedThisSession()) return;

    const tryResume = () => {
      void enableAlertAudio(setAudioReady);
    };
    window.addEventListener("pointerdown", tryResume, { once: true });
    window.addEventListener("keydown", tryResume, { once: true });
    return () => {
      window.removeEventListener("pointerdown", tryResume);
      window.removeEventListener("keydown", tryResume);
    };
  }, [listenConfig, audioReady, pendingForListen.length]);

  async function enableAudioAlert(): Promise<void> {
    await enableAlertAudio(setAudioReady);
  }

  async function handleDeactivate() {
    setDeactivating(true);
    setError(null);
    stopAlertLoop();
    const err = await clearListenConfig();
    if (err) setError(err);
    else setCalls([]);
    setDeactivating(false);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    await enableAudioAlert();
    const err = await saveListenConfig({ floor, sector, role });
    if (err) setError(err);
    setSaving(false);
  }

  async function handleTestSound() {
    await enableAudioAlert();
    const kind = resolveAlertKind(pendingForListen) ?? "bell";
    if (kind === "video") await playVideoAlert();
    else await playBell();
  }

  async function updateCall(id: string, action: string) {
    await enableAudioAlert();
    if (!token) return;
    const res = await fetch(`/api/calls/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Error");
      return;
    }
    const data = (await res.json()) as { call: SerializedCall };
    const call = data.call;
    setCalls((prev) =>
      call.status === "completed" || call.status === "cancelled"
        ? prev.filter((c) => c.id !== call.id)
        : prev.map((c) => (c.id === call.id ? call : c)),
    );
  }

  const roles: StaffRole[] = ["nurse", "quality", "doctor"];
  const alertKind = resolveAlertKind(pendingForListen);

  return (
    <main className={staffContent}>
      <PageHeader
        title="Escucha de llamados"
        subtitle={
          listenConfig
            ? `Piso ${listenConfig.floor} · Sector ${listenConfig.sector} · ${ROLE_LABELS[listenConfig.role]}`
            : "Configure piso, sector y rol para recibir llamados"
        }
      />

      {!audioReady && pendingForListen.length > 0 && (
        <div className={`mb-4 ${staffAlert}`}>
          <p className="font-medium">
            {alertKind === "video"
              ? "Videollamada pendiente — alerta sonora desactivada"
              : "Llamado pendiente — alerta sonora desactivada"}
          </p>
          <p className="mt-1 opacity-90">
            El navegador requiere un clic suyo para reproducir sonido.
          </p>
          <button
            type="button"
            onClick={() =>
              void enableAudioAlert().then(() => {
                const kind = resolveAlertKind(pendingForListen);
                if (kind === "video") void playVideoAlert();
                else if (kind === "bell") void playBell();
              })
            }
            className={`mt-3 ${staffBtnPrimary}`}
          >
            Activar alerta sonora
          </button>
        </div>
      )}

      {audioReady && alertKind && (
        <p className={`mb-4 ${staffSuccess}`}>
          Alerta activa — {alertKind === "video" ? "videollamada" : "timbre"} pendiente
        </p>
      )}

      <form
        onSubmit={handleSave}
        className={`mb-8 grid gap-4 md:grid-cols-4 ${staffCard}`}
      >
        <div>
          <label className={staffLabel}>Piso</label>
          <input
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            className={`mt-1 w-full ${staffInput}`}
            required
          />
        </div>
        <div>
          <label className={staffLabel}>Sector</label>
          <input
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className={`mt-1 w-full ${staffInput}`}
            required
          />
        </div>
        <div>
          <label className={staffLabel}>Rol</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as StaffRole)}
            className={`mt-1 w-full ${staffInput}`}
          >
            {roles.map((r) => (
              <option key={r} value={r} className="bg-[#132337]">
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <button
            type="button"
            onClick={() => void handleTestSound()}
            className={staffBtnGhost}
          >
            Probar sonido
          </button>
          <button
            type="submit"
            disabled={saving || deactivating}
            className={`flex-1 ${staffBtnPrimary}`}
          >
            {saving ? "Guardando…" : "Activar escucha"}
          </button>
          {listenConfig && (
            <button
              type="button"
              disabled={deactivating || saving}
              onClick={() => void handleDeactivate()}
              className={staffBtnDanger}
            >
              {deactivating ? "Desactivando…" : "Desactivar escucha"}
            </button>
          )}
        </div>
      </form>

      {error && <p className={`mb-4 ${staffError}`}>{error}</p>}

      {!listenConfig ? (
        <p className={staffText}>Guarde la configuración para comenzar a recibir llamados.</p>
      ) : calls.length === 0 ? (
        <p className={staffEmpty}>Sin llamados activos en su zona.</p>
      ) : (
        <ul className="space-y-4">
          {calls.map((call) => (
            <li
              key={call.id}
              className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${staffCard}`}
            >
              <div className="flex items-center gap-4">
                <RoleIcon role={call.targetRole} />
                <div>
                  <p className="font-bold text-[#f0f4f8]">
                    Habitación {call.roomNumber}
                  </p>
                  <p className="text-sm text-[#7a9ab5]">
                    Piso {call.floor} · Sector {call.sector} ·{" "}
                    {CALL_TYPE_LABELS[call.type]}
                  </p>
                  <p className="text-xs text-[#7a9ab5]/70">
                    {new Date(call.createdAt).toLocaleString("es")}
                  </p>
                </div>
                <CallTypeIcon type={call.type} />
              </div>
              <div className="flex flex-wrap gap-2">
                {call.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => updateCall(call.id, "accept")}
                    className={staffBtnPrimary}
                  >
                    Atender
                  </button>
                )}
                {call.type === "video" && call.status === "accepted" && (
                  <Link
                    href={`/dashboard/video/${call.id}`}
                    className="rounded-lg bg-violet-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400"
                  >
                    Abrir video
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => updateCall(call.id, "cancel")}
                  className="rounded-lg border border-red-400/30 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => updateCall(call.id, "complete")}
                  className={staffBtnSecondary}
                >
                  Finalizar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
