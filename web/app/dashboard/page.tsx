"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/PageHeader";
import { hasAtLeastRole } from "@/lib/system-roles";
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
  const { token, listenConfig, saveListenConfig, user } = useApp();
  const [floor, setFloor] = useState(listenConfig?.floor ?? "1");
  const [sector, setSector] = useState(listenConfig?.sector ?? "A");
  const [role, setRole] = useState<StaffRole>(listenConfig?.role ?? "nurse");
  const [calls, setCalls] = useState<SerializedCall[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<{
    linked: boolean;
    username: string | null;
    notifyEnabled: boolean;
  } | null>(null);
  const [telegramBusy, setTelegramBusy] = useState(false);

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
  }, [token, listenConfig]);

  useEffect(() => {
    if (!audioReady || pendingForListen.length === 0) {
      syncAlertLoop(null);
      return;
    }
    syncAlertLoop(resolveAlertKind(pendingForListen));
    return () => stopAlertLoop();
  }, [audioReady, pendingForListen]);

  // Tras recargar, la escucha persiste pero el navegador exige un gesto para audio.
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

  const loadTelegramStatus = useCallback(async () => {
    if (!token) return;
    const res = await fetch("/api/staff/telegram", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setTelegramStatus(
        (await res.json()) as {
          linked: boolean;
          username: string | null;
          notifyEnabled: boolean;
        },
      );
    }
  }, [token]);

  useEffect(() => {
    void loadTelegramStatus();
  }, [loadTelegramStatus]);

  async function connectTelegram() {
    if (!token) return;
    setTelegramBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/telegram/link", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { error?: string; url?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "No se pudo generar el enlace");
      }
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error Telegram");
    } finally {
      setTelegramBusy(false);
    }
  }

  async function disconnectTelegram() {
    if (!token) return;
    setTelegramBusy(true);
    await fetch("/api/staff/telegram", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await loadTelegramStatus();
    setTelegramBusy(false);
  }

  async function enableAudioAlert(): Promise<void> {
    await enableAlertAudio(setAudioReady);
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
  const canViewStats = hasAtLeastRole(user?.systemRole ?? "user", "supervisor");
  const isAdmin = user?.systemRole === "admin";

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader
        title="Escucha de llamados"
        subtitle={
          listenConfig
            ? `Piso ${listenConfig.floor} · Sector ${listenConfig.sector} · ${ROLE_LABELS[listenConfig.role]}${listening ? " · En línea" : ""}`
            : "Configure dónde escuchar"
        }
      />

      {(isAdmin || canViewStats) && (
        <div className="mb-6 flex flex-wrap gap-3">
          {isAdmin && (
            <Link
              href="/dashboard/admin"
              className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-900 hover:bg-teal-100"
            >
              Administración →
            </Link>
          )}
          {canViewStats && (
            <Link
              href="/estadisticas"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Estadísticas e historial →
            </Link>
          )}
        </div>
      )}

      {!audioReady && pendingForListen.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">
            {alertKind === "video"
              ? "Videollamada pendiente — alerta sonora desactivada"
              : "Llamado pendiente — alerta sonora desactivada"}
          </p>
          <p className="mt-1 text-amber-900">
            El navegador requiere un clic suyo para reproducir sonido (timbre o
            video).
          </p>
          <button
            type="button"
            onClick={() => void enableAudioAlert().then(() => {
              const kind = resolveAlertKind(pendingForListen);
              if (kind === "video") void playVideoAlert();
              else if (kind === "bell") void playBell();
            })}
            className="mt-3 min-h-11 rounded-lg bg-amber-600 px-5 py-2 font-semibold text-white hover:bg-amber-700"
          >
            Activar alerta sonora
          </button>
        </div>
      )}

      {audioReady && alertKind && (
        <p className="mb-4 rounded-lg bg-teal-50 px-4 py-3 text-sm text-teal-900">
          Alerta activa —{" "}
          {alertKind === "video" ? "videollamada" : "timbre"} pendiente
        </p>
      )}

      <form
        onSubmit={handleSave}
        className="mb-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-4"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700">Piso</label>
          <input
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Sector</label>
          <input
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Rol</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as StaffRole)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => void handleTestSound()}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Probar sonido
          </button>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-teal-600 py-2.5 font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Activar escucha"}
          </button>
        </div>
      </form>

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Notificaciones Telegram
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Reciba un mensaje en el celular cuando haya un llamado y tenga{" "}
          <strong>escucha activa</strong> en este dashboard.
        </p>
        {telegramStatus?.linked ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-medium text-teal-900">
              Vinculado
              {telegramStatus.username
                ? ` · @${telegramStatus.username}`
                : ""}
            </span>
            <button
              type="button"
              disabled={telegramBusy}
              onClick={() => void disconnectTelegram()}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Desvincular
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={telegramBusy || !token}
            onClick={() => void connectTelegram()}
            className="mt-4 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {telegramBusy ? "Generando enlace…" : "Conectar Telegram"}
          </button>
        )}
      </section>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!listenConfig ? (
        <p className="text-slate-600">
          Guarde la configuración para comenzar a recibir llamados.
        </p>
      ) : calls.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-slate-500">
          Sin llamados activos en su zona.
        </p>
      ) : (
        <ul className="space-y-4">
          {calls.map((call) => (
            <li
              key={call.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <RoleIcon role={call.targetRole} />
                <div>
                  <p className="font-bold text-slate-900">
                    Habitación {call.roomNumber}
                  </p>
                  <p className="text-sm text-slate-600">
                    Piso {call.floor} · Sector {call.sector} ·{" "}
                    {CALL_TYPE_LABELS[call.type]}
                  </p>
                  <p className="text-xs text-slate-400">
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
                    className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                  >
                    Atender
                  </button>
                )}
                {call.type === "video" && call.status === "accepted" && (
                  <Link
                    href={`/dashboard/video/${call.id}`}
                    className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                  >
                    Abrir video
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => updateCall(call.id, "cancel")}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => updateCall(call.id, "complete")}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
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
