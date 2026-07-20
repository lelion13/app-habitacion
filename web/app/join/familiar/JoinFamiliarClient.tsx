"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { VideoCallSession } from "@/components/VideoCallSession";

type JoinState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | {
      phase: "ready";
      token: string;
      callId: string;
    };

export function JoinFamiliarClient() {
  const searchParams = useSearchParams();
  const joinToken = searchParams.get("token");
  const [state, setState] = useState<JoinState>({ phase: "loading" });
  const [ended, setEnded] = useState(false);

  const exchangeToken = useCallback(async (token: string) => {
    setState({ phase: "loading" });
    try {
      const res = await fetch("/api/calls/family-join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setState({
          phase: "error",
          message:
            data?.error ??
            "No se pudo abrir la videollamada. Solicite un nuevo enlace.",
        });
        return;
      }

      const data = (await res.json()) as {
        token: string;
        callId: string;
      };

      setState({
        phase: "ready",
        token: data.token,
        callId: data.callId,
      });
    } catch {
      setState({
        phase: "error",
        message: "Error de conexión. Verifique su red e intente de nuevo.",
      });
    }
  }, []);

  useEffect(() => {
    if (!joinToken) {
      setState({
        phase: "error",
        message: "Enlace inválido. Abra el enlace desde el correo de invitación.",
      });
      return;
    }
    void exchangeToken(joinToken);
  }, [joinToken, exchangeToken]);

  if (ended) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
        <div className="max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="text-xl font-semibold">Llamada finalizada</h1>
          <p className="mt-3 text-sm text-slate-300">
            Puede cerrar esta ventana.
          </p>
        </div>
      </main>
    );
  }

  if (state.phase === "loading") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-slate-950 px-4 text-white">
        <p className="text-lg font-medium">Conectando videollamada…</p>
        <p className="mt-2 text-sm text-slate-400">Espere un momento</p>
      </main>
    );
  }

  if (state.phase === "error") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
        <div className="max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="mt-2 text-xl font-semibold">No se pudo unir</h1>
          <p className="mt-3 text-sm text-slate-300">{state.message}</p>
        </div>
      </main>
    );
  }

  return (
    <VideoCallSession
      callId={state.callId}
      role="staff"
      token={state.token}
      familySignalStream
      autoStart
      fullscreen
      onEnded={() => setEnded(true)}
    />
  );
}
