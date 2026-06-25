import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAuthError, requireSupervisor } from "@/lib/admin-auth";
import { serializeCall } from "@/lib/calls";
import {
  buildHistoryMatch,
  parseHistoryParams,
  roundAvg,
} from "@/lib/call-history";
import type { Call } from "@/lib/types";

interface HistorySummary {
  totalCalls: number;
  avgResponseTimeMs: number | null;
  avgSessionDurationMs: number | null;
  bellCount: number;
  videoCount: number;
}

export async function GET(request: NextRequest) {
  const auth = await requireSupervisor(request);
  if (isAuthError(auth)) return auth.error;

  const parsed = parseHistoryParams(request.nextUrl.searchParams);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const includeSummary =
    request.nextUrl.searchParams.get("includeSummary") === "true";
  const match = buildHistoryMatch(parsed);
  const skip = (parsed.page - 1) * parsed.limit;

  const db = await getDb();
  const collection = db.collection<Call>("calls");

  const [total, calls] = await Promise.all([
    collection.countDocuments(match),
    collection
      .find(match)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsed.limit)
      .toArray(),
  ]);

  let summary: HistorySummary | undefined;
  if (includeSummary) {
    const agg = await collection
      .aggregate<{
        totalCalls: number;
        avgResponseTimeMs: number | null;
        avgSessionDurationMs: number | null;
        bellCount: number;
        videoCount: number;
      }>([
        { $match: match },
        {
          $group: {
            _id: null,
            totalCalls: { $sum: 1 },
            avgResponseTimeMs: { $avg: "$responseTimeMs" },
            avgSessionDurationMs: { $avg: "$sessionDurationMs" },
            bellCount: {
              $sum: { $cond: [{ $eq: ["$type", "bell"] }, 1, 0] },
            },
            videoCount: {
              $sum: { $cond: [{ $eq: ["$type", "video"] }, 1, 0] },
            },
          },
        },
      ])
      .toArray();

    const row = agg[0];
    summary = {
      totalCalls: row?.totalCalls ?? 0,
      avgResponseTimeMs: roundAvg(row?.avgResponseTimeMs),
      avgSessionDurationMs: roundAvg(row?.avgSessionDurationMs),
      bellCount: row?.bellCount ?? 0,
      videoCount: row?.videoCount ?? 0,
    };
  }

  return NextResponse.json({
    calls: calls.map(serializeCall),
    pagination: {
      page: parsed.page,
      limit: parsed.limit,
      total,
      totalPages: Math.ceil(total / parsed.limit) || 1,
    },
    ...(summary && { summary }),
  });
}
