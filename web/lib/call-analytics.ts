import type { CallChannel, StaffRole } from "./types";
import { roundAvg } from "./call-history";

export const MAX_CHART_DAYS = 90;

export interface ChannelSplitBucket {
  web: number;
  telegram: number;
  unknown: number;
}

export interface CallChartsData {
  callsByDay: {
    date: string;
    count: number;
    bell: number;
    video: number;
  }[];
  avgResponseByDay: { date: string; avgMs: number | null }[];
  channelSplit: {
    accepted: ChannelSplitBucket;
    completed: ChannelSplitBucket;
  };
  byFloor: { floor: string; count: number }[];
  bySector: { sector: string; count: number }[];
  byRole: { role: StaffRole; count: number }[];
}

export function chartRangeExceeded(from: Date, to: Date): boolean {
  const maxMs = MAX_CHART_DAYS * 24 * 60 * 60 * 1000;
  return to.getTime() - from.getTime() > maxMs;
}

export function bucketChannel(
  rows: { _id: string | null; count: number }[],
): ChannelSplitBucket {
  const bucket: ChannelSplitBucket = { web: 0, telegram: 0, unknown: 0 };
  for (const row of rows) {
    if (row._id === "web") bucket.web = row.count;
    else if (row._id === "telegram") bucket.telegram = row.count;
    else bucket.unknown += row.count;
  }
  return bucket;
}

function formatDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function buildCallsByDaySeries(
  rows: { _id: string; count: number; bell: number; video: number }[],
): CallChartsData["callsByDay"] {
  return rows
    .map((r) => ({
      date: r._id,
      count: r.count,
      bell: r.bell,
      video: r.video,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function buildAvgResponseSeries(
  rows: { _id: string; avgMs: number | null }[],
): CallChartsData["avgResponseByDay"] {
  return rows
    .map((r) => ({ date: r._id, avgMs: roundAvg(r.avgMs) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export { formatDayKey };
