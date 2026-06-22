import { Suspense } from "react";
import type { Metadata } from "next";
import { HabitacionClient } from "./HabitacionClient";
import { getRoomByKey } from "@/lib/get-room-by-key";
import { manifestShortName } from "@/lib/room-manifest";

type PageProps = {
  searchParams: Promise<{ key?: string | string[] }>;
};

function resolveRoomKey(raw: string | string[] | undefined): string {
  if (typeof raw === "string") return raw.trim();
  return raw?.[0]?.trim() ?? "";
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const roomKey = resolveRoomKey(params.key);

  if (!roomKey) {
    return { title: "Habitación · App Habitación" };
  }

  const manifestUrl = `/api/manifest?key=${encodeURIComponent(roomKey)}`;
  const room = await getRoomByKey(roomKey);

  if (!room) {
    return {
      title: "Habitación · App Habitación",
      manifest: manifestUrl,
    };
  }

  const shortName = manifestShortName(room.label, room.number);

  return {
    title: room.label,
    applicationName: shortName,
    manifest: manifestUrl,
    icons: {
      apple: "/icons/icon-192.png",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: shortName,
    },
  };
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
      <HabitacionClient />
    </Suspense>
  );
}
