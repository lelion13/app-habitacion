"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/PageHeader";
import { RoleIcon, CallTypeIcon } from "@/components/RoleIcon";
import { playBell, unlockBellAudio } from "@/lib/bell";
import {
  ROLE_LABELS,
  CALL_TYPE_LABELS,
  type StaffRole,
  type CallType,
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
  const { token, listenConfig, saveListenConfig } = useApp();
  const [floor, setFloor] = useState(listenConfig?.floor ?? "1");
  const [sector, setSector] = useState(listenConfig?.sector ?? "A");
  const [role, setRole] = useState<StaffRole>(listenConfig?.role ?? "nurse");
  const [calls, setCalls] = useState<SerializedCall[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const knownCallIds = useRef(new Set<string>());

  function notifyIfNewBell(call: SerializedCall) {
    if (call.type !== "bell" || call.status !== "pending") return;
    if (knownCallIds.current.has(call.id)) return;
    knownCallIds.current.add(call.id);
    void playBell();
  }

  const loadCalls = useCallback(async (notifyNew = false) => {
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
    if (notifyNew) {
      for (const call of data.calls) {
        notifyIfNewBell(call);
      }
    } else {
      knownCallIds.current = new Set(data.calls.map((call) => call.id));
    }
    setCalls(data.calls);
  }, [token, listenConfig]);

  useEffect(() => {
    if (listenConfig) {
      setFloor(listenConfig.floor);
      setSector(listenConfig.sector);
      setRole(listenConfig.role);
      knownCallIds.current.clear();
      void loadCalls(false);
    }
  }, [listenConfig, loadCalls]);

  useEffect(() => {
    if (!token || !listenConfig) return;

    const poll = window.setInterval(() => {
      void loadCalls(true);
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
      notifyIfNewBell(call);
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

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    await unlockBellAudio();
    const err = await saveListenConfig({ floor, sector, role });
    if (err) setError(err);
    else knownCallIds.current.clear();
    setSaving(false);
  }

  async function updateCall(id: string, action: string) {
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
            onClick={() => void unlockBellAudio().then(playBell)}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Probar timbre
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
