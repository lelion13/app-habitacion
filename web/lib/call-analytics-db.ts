import type { Db } from "mongodb";
import type { Call } from "./types";
import {
  bucketChannel,
  buildAvgResponseSeries,
  buildCallsByDaySeries,
  type CallChartsData,
} from "./call-analytics";

export async function fetchCallCharts(
  db: Db,
  match: Record<string, unknown>,
): Promise<CallChartsData> {
  const collection = db.collection<Call>("calls");

  const [
    callsByDayRaw,
    avgResponseRaw,
    acceptedChannelRaw,
    completedChannelRaw,
    byFloorRaw,
    bySectorRaw,
    byRoleRaw,
  ] = await Promise.all([
    collection
      .aggregate<{ _id: string; count: number; bell: number; video: number }>([
        { $match: match },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
            bell: { $sum: { $cond: [{ $eq: ["$type", "bell"] }, 1, 0] } },
            video: { $sum: { $cond: [{ $eq: ["$type", "video"] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray(),
    collection
      .aggregate<{ _id: string; avgMs: number | null }>([
        { $match: { ...match, responseTimeMs: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            avgMs: { $avg: "$responseTimeMs" },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray(),
    collection
      .aggregate<{ _id: string | null; count: number }>([
        { $match: { ...match, acceptedBy: { $exists: true } } },
        {
          $group: {
            _id: "$acceptedChannel",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray(),
    collection
      .aggregate<{ _id: string | null; count: number }>([
        { $match: { ...match, status: "completed" } },
        {
          $group: {
            _id: "$completedChannel",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray(),
    collection
      .aggregate<{ _id: string; count: number }>([
        { $match: match },
        { $group: { _id: "$floor", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 12 },
      ])
      .toArray(),
    collection
      .aggregate<{ _id: string; count: number }>([
        { $match: match },
        { $group: { _id: "$sector", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 12 },
      ])
      .toArray(),
    collection
      .aggregate<{ _id: string; count: number }>([
        { $match: match },
        { $group: { _id: "$targetRole", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray(),
  ]);

  return {
    callsByDay: buildCallsByDaySeries(callsByDayRaw),
    avgResponseByDay: buildAvgResponseSeries(avgResponseRaw),
    channelSplit: {
      accepted: bucketChannel(acceptedChannelRaw),
      completed: bucketChannel(completedChannelRaw),
    },
    byFloor: byFloorRaw.map((r) => ({ floor: r._id, count: r.count })),
    bySector: bySectorRaw.map((r) => ({ sector: r._id, count: r.count })),
    byRole: byRoleRaw.map((r) => ({
      role: r._id as Call["targetRole"],
      count: r.count,
    })),
  };
}
