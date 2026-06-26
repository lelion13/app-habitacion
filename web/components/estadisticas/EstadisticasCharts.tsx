"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDurationMs } from "@/lib/format-duration";
import { ROLE_LABELS, type StaffRole } from "@/lib/types";
import { staffCard, staffText, staffTitle } from "@/lib/staff-theme";
import type { CallChartsData } from "@/lib/call-analytics";

const CHART_COLORS = {
  bell: "#5ee9b5",
  video: "#74d4ff",
  web: "#00bc7d",
  telegram: "#38bdf8",
  unknown: "#7a9ab5",
  accent: "#00bc7d",
  grid: "rgba(255,255,255,0.08)",
  text: "#7a9ab5",
};

interface EstadisticasChartsProps {
  charts: CallChartsData | null;
  loading: boolean;
}

function ChartCard({
  title,
  children,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <div className={staffCard}>
      <h3 className={`mb-4 ${staffTitle}`}>{title}</h3>
      {empty ? (
        <p className={`py-8 text-center ${staffText}`}>
          Sin datos para el rango seleccionado.
        </p>
      ) : (
        children
      )}
    </div>
  );
}

export function EstadisticasCharts({ charts, loading }: EstadisticasChartsProps) {
  if (loading && !charts) {
    return (
      <p className={`mb-8 ${staffText}`}>Cargando gráficos…</p>
    );
  }

  if (!charts) return null;

  const hasCalls = charts.callsByDay.length > 0;
  const acceptedPie = [
    { name: "Web", value: charts.channelSplit.accepted.web, key: "web" },
    {
      name: "Telegram",
      value: charts.channelSplit.accepted.telegram,
      key: "telegram",
    },
    {
      name: "Desconocido",
      value: charts.channelSplit.accepted.unknown,
      key: "unknown",
    },
  ].filter((d) => d.value > 0);

  const floorData = charts.byFloor.map((r) => ({
    name: `Piso ${r.floor}`,
    count: r.count,
  }));
  const sectorData = charts.bySector.map((r) => ({
    name: r.sector,
    count: r.count,
  }));
  const roleData = charts.byRole.map((r) => ({
    name: ROLE_LABELS[r.role as StaffRole] ?? r.role,
    count: r.count,
  }));

  const tooltipStyle = {
    backgroundColor: "#0d1b2a",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    color: "#f0f4f8",
  };

  return (
    <div className="mb-8 grid gap-6 lg:grid-cols-2">
      <ChartCard title="Llamados por día" empty={!hasCalls}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={charts.callsByDay}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis dataKey="date" tick={{ fill: CHART_COLORS.text, fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fill: CHART_COLORS.text, fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Bar dataKey="bell" name="Timbre" stackId="a" fill={CHART_COLORS.bell} />
            <Bar dataKey="video" name="Video" stackId="a" fill={CHART_COLORS.video} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Tiempo de respuesta promedio" empty={charts.avgResponseByDay.length === 0}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={charts.avgResponseByDay}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis dataKey="date" tick={{ fill: CHART_COLORS.text, fontSize: 11 }} />
            <YAxis
              tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
              tickFormatter={(v: number) => formatDurationMs(v) ?? ""}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => formatDurationMs(Number(value))}
            />
            <Line
              type="monotone"
              dataKey="avgMs"
              name="Respuesta"
              stroke={CHART_COLORS.accent}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.accent }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Canal de atención" empty={acceptedPie.length === 0}>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={acceptedPie}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ name, percent }) =>
                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
            >
              {acceptedPie.map((entry) => (
                <Cell
                  key={entry.key}
                  fill={
                    CHART_COLORS[entry.key as keyof typeof CHART_COLORS] ??
                    CHART_COLORS.unknown
                  }
                />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Por piso" empty={floorData.length === 0}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={floorData} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis type="number" tick={{ fill: CHART_COLORS.text, fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={72}
              tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" name="Llamados" fill={CHART_COLORS.accent} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Por sector" empty={sectorData.length === 0}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={sectorData} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis type="number" tick={{ fill: CHART_COLORS.text, fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={48}
              tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" name="Llamados" fill={CHART_COLORS.video} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Por rol destino" empty={roleData.length === 0}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={roleData} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis type="number" tick={{ fill: CHART_COLORS.text, fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" name="Llamados" fill={CHART_COLORS.bell} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
