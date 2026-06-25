"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/PageHeader";
import { formatDurationMs } from "@/lib/format-duration";
import {
  staffBtnPrimary,
  staffBtnSecondary,
  staffCard,
  staffContent,
  staffEmpty,
  staffError,
  staffInput,
  staffKpiCard,
  staffLabelXs,
  staffText,
} from "@/lib/staff-theme";
import {
  CALL_TYPE_LABELS,
  ROLE_LABELS,
  type CallStatus,
  type CallType,
  type StaffRole,
} from "@/lib/types";

interface HistoryCall {
  id: string;
  roomNumber: string;
  floor: string;
  sector: string;
  type: CallType;
  targetRole: StaffRole;
  status: CallStatus;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
  responseTimeMs?: number;
  totalDurationMs?: number;
  sessionDurationMs?: number;
}

interface HistorySummary {
  totalCalls: number;
  avgResponseTimeMs: number | null;
  avgSessionDurationMs: number | null;
  bellCount: number;
  videoCount: number;
}

function defaultFromDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

const STATUS_LABELS: Record<CallStatus, string> = {
  pending: "Pendiente",
  accepted: "Atendido",
  completed: "Completado",
  cancelled: "Cancelado",
};

export default function EstadisticasPage() {
  const { token } = useApp();
  const [from, setFrom] = useState(defaultFromDate);
  const [to, setTo] = useState(todayDate);
  const [floor, setFloor] = useState("");
  const [sector, setSector] = useState("");
  const [targetRole, setTargetRole] = useState<StaffRole | "">("");
  const [roomNumber, setRoomNumber] = useState("");
  const [type, setType] = useState<CallType | "">("");
  const [status, setStatus] = useState<CallStatus | "">("");
  const [page, setPage] = useState(1);

  const [calls, setCalls] = useState<HistoryCall[]>([]);
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      from: new Date(`${from}T00:00:00`).toISOString(),
      to: new Date(`${to}T23:59:59`).toISOString(),
      page: String(page),
      limit: "20",
      includeSummary: "true",
    });
    if (floor) params.set("floor", floor);
    if (sector) params.set("sector", sector);
    if (targetRole) params.set("targetRole", targetRole);
    if (roomNumber) params.set("roomNumber", roomNumber);
    if (type) params.set("type", type);
    if (status) params.set("status", status);

    try {
      const res = await fetch(`/api/calls/history?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as {
        error?: string;
        calls?: HistoryCall[];
        summary?: HistorySummary;
        pagination?: { totalPages: number };
      };
      if (!res.ok) throw new Error(data.error ?? "Error al cargar historial");
      setCalls(data.calls ?? []);
      setSummary(data.summary ?? null);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [
    token,
    from,
    to,
    floor,
    sector,
    targetRole,
    roomNumber,
    type,
    status,
    page,
  ]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  function handleFilterSubmit(e: FormEvent) {
    e.preventDefault();
    if (page !== 1) setPage(1);
    else void loadHistory();
  }

  const roles: StaffRole[] = ["nurse", "quality", "doctor"];

  return (
    <main className={staffContent}>
      <PageHeader
        title="Estadísticas"
        subtitle="Historial de timbres y videollamadas — todo el hospital"
      />

      <form
        onSubmit={handleFilterSubmit}
        className={`mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${staffCard}`}
      >
        <div>
          <label className={staffLabelXs}>Desde</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={`mt-1 w-full ${staffInput}`}
          />
        </div>
        <div>
          <label className={staffLabelXs}>Hasta</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={`mt-1 w-full ${staffInput}`}
          />
        </div>
        <div>
          <label className={staffLabelXs}>Piso</label>
          <input
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            className={`mt-1 w-full ${staffInput}`}
            placeholder="Todos"
          />
        </div>
        <div>
          <label className={staffLabelXs}>Sector</label>
          <input
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className={`mt-1 w-full ${staffInput}`}
            placeholder="Todos"
          />
        </div>
        <div>
          <label className={staffLabelXs}>Rol destino</label>
          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value as StaffRole | "")}
            className={`mt-1 w-full ${staffInput}`}
          >
            <option value="">Todos</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={staffLabelXs}>Habitación</label>
          <input
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            className={`mt-1 w-full ${staffInput}`}
            placeholder="Ej. 101"
          />
        </div>
        <div>
          <label className={staffLabelXs}>Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as CallType | "")}
            className={`mt-1 w-full ${staffInput}`}
          >
            <option value="">Todos</option>
            <option value="bell">Timbre</option>
            <option value="video">Video</option>
          </select>
        </div>
        <div>
          <label className={staffLabelXs}>Estado</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CallStatus | "")}
            className={`mt-1 w-full ${staffInput}`}
          >
            <option value="">Todos</option>
            {(Object.keys(STATUS_LABELS) as CallStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            disabled={loading}
            className={staffBtnPrimary}
          >
            {loading ? "Cargando…" : "Aplicar filtros"}
          </button>
        </div>
      </form>

      {error && (
        <p className={`mb-4 ${staffError}`}>{error}</p>
      )}

      {summary && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard label="Total llamados" value={String(summary.totalCalls)} />
          <KpiCard label="Timbres" value={String(summary.bellCount)} />
          <KpiCard label="Videos" value={String(summary.videoCount)} />
          <KpiCard
            label="Respuesta prom."
            value={formatDurationMs(summary.avgResponseTimeMs)}
          />
          <KpiCard
            label="Sesión prom."
            value={formatDurationMs(summary.avgSessionDurationMs)}
          />
        </div>
      )}

      <div className={`overflow-x-auto ${staffCard}`}>
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase text-[#7a9ab5]">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Hab.</th>
              <th className="px-4 py-3">Piso/Sector</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Respuesta</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Sesión</th>
            </tr>
          </thead>
          <tbody>
            {calls.length === 0 ? (
              <tr>
                <td colSpan={9} className={`px-4 py-10 text-center ${staffText}`}>
                  Sin resultados para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              calls.map((call) => (
                <tr key={call.id} className="border-b border-white/[0.06] text-[#f0f4f8]">
                  <td className="whitespace-nowrap px-4 py-3">
                    {new Date(call.createdAt).toLocaleString("es")}
                  </td>
                  <td className="px-4 py-3 font-medium">{call.roomNumber}</td>
                  <td className="px-4 py-3">
                    {call.floor}/{call.sector}
                  </td>
                  <td className="px-4 py-3">{CALL_TYPE_LABELS[call.type]}</td>
                  <td className="px-4 py-3">{ROLE_LABELS[call.targetRole]}</td>
                  <td className="px-4 py-3">{STATUS_LABELS[call.status]}</td>
                  <td className="px-4 py-3">
                    {formatDurationMs(call.responseTimeMs)}
                  </td>
                  <td className="px-4 py-3">
                    {formatDurationMs(call.totalDurationMs)}
                  </td>
                  <td className="px-4 py-3">
                    {formatDurationMs(call.sessionDurationMs)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
            className={staffBtnSecondary}
          >
            Anterior
          </button>
          <span className={staffText}>
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className={staffBtnSecondary}
          >
            Siguiente
          </button>
        </div>
      )}
    </main>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className={staffKpiCard}>
      <p className="text-xs font-medium uppercase tracking-wide text-[#7a9ab5]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-[#f0f4f8]">{value}</p>
    </div>
  );
}
