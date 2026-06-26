import { Suspense } from "react";
import { JoinVideoClient } from "./JoinVideoClient";

export default function JoinVideoPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh flex-col items-center justify-center bg-slate-950 px-4 text-white">
          <p className="text-lg font-medium">Cargando…</p>
        </main>
      }
    >
      <JoinVideoClient />
    </Suspense>
  );
}
