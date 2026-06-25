"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ListenConfig } from "@/lib/types";
import type { WebRtcSignalMessage } from "@/lib/webrtc-signal";
import {
  acquireLocalMedia,
  attachLocalTracks,
  closePeerConnection,
  createPeerConnection,
  stopMediaStream,
} from "@/lib/webrtc";
import {
  HABITACION_BG,
  HABITACION_BORDER,
  HABITACION_MUTED,
} from "@/lib/habitacion-theme";
import { HabitacionVideoEndModal } from "@/components/habitacion/HabitacionVideoEndModal";
import { HabitacionToast } from "@/components/habitacion/HabitacionToast";

type ConnectionState = "idle" | "connecting" | "connected" | "error";
type ShellVariant = "default" | "habitacion";

interface VideoCallSessionProps {
  callId: string;
  role: "room" | "staff";
  roomKey?: string;
  token?: string;
  listenConfig?: ListenConfig;
  roomId?: string;
  fullscreen?: boolean;
  autoStart?: boolean;
  shellVariant?: ShellVariant;
  onEnded?: () => void;
}

function signalKey(message: WebRtcSignalMessage): string {
  return `${message.from}:${message.type}:${message.payload}`;
}

export function VideoCallSession({
  callId,
  role,
  roomKey,
  token,
  listenConfig,
  roomId,
  fullscreen = false,
  autoStart = false,
  shellVariant = "default",
  onEnded,
}: VideoCallSessionProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescSetRef = useRef(false);
  const processedSignalsRef = useRef(new Set<string>());
  const sessionActiveRef = useRef(false);
  const autoStartedRef = useRef(false);
  const handleSignalRef = useRef<(message: WebRtcSignalMessage) => Promise<void>>(
    async () => {},
  );

  const [connectionState, setConnectionState] =
    useState<ConnectionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [ending, setEnding] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  const cleanup = useCallback(() => {
    sessionActiveRef.current = false;
    closePeerConnection(pcRef.current);
    pcRef.current = null;
    stopMediaStream(localStreamRef.current);
    localStreamRef.current = null;
    pendingIceRef.current = [];
    remoteDescSetRef.current = false;
    processedSignalsRef.current.clear();
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const postSignal = useCallback(
    async (type: WebRtcSignalMessage["type"], payload: string) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (role === "staff" && token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const body: Record<string, string> = { from: role, type, payload };
      if (role === "room" && roomKey) {
        body.roomKey = roomKey;
      }

      const res = await fetch(`/api/calls/${callId}/signal`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error("Error al enviar señal WebRTC");
      }
    },
    [callId, role, roomKey, token],
  );

  const flushPendingIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    remoteDescSetRef.current = true;
    for (const candidate of pendingIceRef.current) {
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        /* ignore stale candidates */
      }
    }
    pendingIceRef.current = [];
  }, []);

  const addIceCandidate = useCallback(async (payload: string) => {
    const pc = pcRef.current;
    if (!pc) return;

    let candidate: RTCIceCandidateInit;
    try {
      candidate = JSON.parse(payload) as RTCIceCandidateInit;
    } catch {
      return;
    }

    if (!remoteDescSetRef.current) {
      pendingIceRef.current.push(candidate);
      return;
    }

    try {
      await pc.addIceCandidate(candidate);
    } catch {
      /* ignore */
    }
  }, []);

  const handleRemoteStream = useCallback((stream: MediaStream) => {
    const el = remoteVideoRef.current;
    if (!el) return;
    el.srcObject = stream;
    void el.play().catch(() => {
      /* autoplay policy */
    });
    setConnectionState("connected");
  }, []);

  const handleSignal = useCallback(
    async (message: WebRtcSignalMessage) => {
      if (message.callId !== callId) return;
      if (message.from === role) return;

      const key = signalKey(message);
      if (processedSignalsRef.current.has(key)) return;

      if (message.type === "offer" && role === "staff") {
        if (!sessionActiveRef.current || !pcRef.current) return;

        const activePc = pcRef.current;
        await activePc.setRemoteDescription({
          type: "offer",
          sdp: message.payload,
        });
        await flushPendingIce();

        const answer = await activePc.createAnswer();
        await activePc.setLocalDescription(answer);
        await postSignal("answer", answer.sdp ?? "");
        setConnectionState("connecting");
        processedSignalsRef.current.add(key);
        return;
      }

      if (message.type === "answer" && role === "room") {
        if (!pcRef.current) return;

        await pcRef.current.setRemoteDescription({
          type: "answer",
          sdp: message.payload,
        });
        await flushPendingIce();
        setConnectionState("connecting");
        processedSignalsRef.current.add(key);
        return;
      }

      if (message.type === "ice") {
        if (!pcRef.current) return;
        await addIceCandidate(message.payload);
        processedSignalsRef.current.add(key);
      }
    },
    [addIceCandidate, callId, flushPendingIce, postSignal, role],
  );

  handleSignalRef.current = handleSignal;

  const fetchBufferedSignals = useCallback(async () => {
    const params = new URLSearchParams();
    if (role === "room" && roomKey) {
      params.set("key", roomKey);
    } else if (role === "staff" && token) {
      params.set("token", token);
    } else {
      return;
    }

    const res = await fetch(`/api/calls/${callId}/signal?${params}`);
    if (!res.ok) return;

    const data = (await res.json()) as { signals: WebRtcSignalMessage[] };
    for (const signal of data.signals) {
      await handleSignalRef.current(signal);
    }
  }, [callId, role, roomKey, token]);

  const ensurePeer = useCallback(() => {
    if (pcRef.current) return pcRef.current;

    const pc = createPeerConnection({
      onRemoteStream: handleRemoteStream,
      onIceCandidate: (candidate) => {
        void postSignal("ice", JSON.stringify(candidate));
      },
      onConnectionStateChange: (state) => {
        if (state === "connected") {
          setConnectionState("connected");
        } else if (state === "failed") {
          setConnectionState("error");
          setError(
            "No se pudo establecer la conexión de video. Intente finalizar y volver a llamar.",
          );
        }
      },
    });

    pcRef.current = pc;
    return pc;
  }, [handleRemoteStream, postSignal]);

  const startSession = useCallback(async () => {
    if (sessionActiveRef.current) return;

    setError(null);
    setConnectionState("connecting");
    setStarted(true);

    try {
      const stream = await acquireLocalMedia();
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = ensurePeer();
      attachLocalTracks(pc, stream);
      sessionActiveRef.current = true;

      if (role === "room") {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await postSignal("offer", offer.sdp ?? "");
      }

      await fetchBufferedSignals();
    } catch {
      sessionActiveRef.current = false;
      setConnectionState("error");
      setError(
        "No se pudo acceder a cámara/micrófono. Verifique permisos del navegador.",
      );
      cleanup();
      setStarted(false);
    }
  }, [cleanup, ensurePeer, fetchBufferedSignals, postSignal, role]);

  const endCall = useCallback(async () => {
    if (ending) return;
    setEnding(true);
    setError(null);

    try {
      if (role === "staff") {
        if (!token) throw new Error("missing token");
        const res = await fetch(`/api/calls/${callId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "complete" }),
        });
        if (!res.ok) throw new Error("complete failed");
      } else if (role === "room") {
        if (!roomKey) throw new Error("missing roomKey");
        const res = await fetch(
          `/api/calls/room?key=${encodeURIComponent(roomKey)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "cancel", roomKey }),
          },
        );
        if (!res.ok) throw new Error("cancel failed");
      }

      cleanup();
      setStarted(false);
      setConnectionState("idle");
      onEnded?.();
    } catch {
      setError("No se pudo finalizar la llamada. Intente de nuevo.");
    } finally {
      setEnding(false);
    }
  }, [callId, cleanup, ending, onEnded, role, roomKey, token]);

  useEffect(() => {
    if (!started) return;

    let source: EventSource | null = null;

    if (role === "room" && roomId) {
      source = new EventSource(
        `/api/calls/room/stream?roomId=${encodeURIComponent(roomId)}`,
      );
     } else if (role === "staff" && listenConfig && token) {
      const params = new URLSearchParams({
        floor: listenConfig.floor,
        sector: listenConfig.sector,
        role: listenConfig.role,
        token,
      });
      source = new EventSource(`/api/calls/stream?${params}`);
    }

    if (!source) return;

    const onSignal = (event: MessageEvent) => {
      const message = JSON.parse(event.data as string) as WebRtcSignalMessage;
      void handleSignalRef.current(message);
    };

    source.addEventListener("webrtc:signal", onSignal);

    return () => {
      source.removeEventListener("webrtc:signal", onSignal);
      source.close();
    };
  }, [started, role, roomId, listenConfig, token]);

  useEffect(() => {
    if (!started || connectionState === "connected") return;

    const poll = window.setInterval(() => {
      void fetchBufferedSignals();
    }, 2000);

    return () => window.clearInterval(poll);
  }, [started, connectionState, fetchBufferedSignals]);

  useEffect(() => {
    if (!autoStart || autoStartedRef.current) return;
    autoStartedRef.current = true;
    void startSession();
  }, [autoStart, startSession]);

  const statusLabel =
    connectionState === "connected"
      ? "Videollamada conectada"
      : connectionState === "connecting"
        ? "Conectando…"
        : connectionState === "error"
          ? (error ?? "Error de conexión")
          : "Listo para iniciar";

  const isHabitacion = shellVariant === "habitacion";
  const shellClass = fullscreen
    ? "fixed inset-0 z-50 flex flex-col text-white"
    : "flex min-h-dvh flex-col text-white";
  const shellStyle = {
    ...(fullscreen ? { height: "100dvh" } : {}),
    background: isHabitacion ? HABITACION_BG : undefined,
  };
  const primaryBtnClass = isHabitacion
    ? "rounded-2xl bg-sky-500 px-6 py-4 text-lg font-black text-white hover:bg-sky-400"
    : "rounded-xl bg-violet-600 px-6 py-4 text-lg font-semibold text-white hover:bg-violet-700";
  const secondaryBtnClass = isHabitacion
    ? "rounded-2xl border px-6 py-3 font-bold text-white hover:bg-white/5"
    : "rounded-xl bg-slate-700 px-6 py-3 font-semibold text-white hover:bg-slate-600";
  const headerClass = isHabitacion
    ? "shrink-0 border-b px-4 py-3 text-center text-sm font-semibold"
    : "shrink-0 border-b border-slate-800 px-4 py-2 text-center text-sm text-slate-300";
  const footerClass = isHabitacion
    ? "shrink-0 border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    : "shrink-0 border-t border-slate-800 bg-slate-950 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]";
  const endBtnClass = isHabitacion
    ? "min-h-12 w-full rounded-2xl text-base font-black text-white hover:opacity-90 disabled:opacity-50"
    : "min-h-12 w-full rounded-xl bg-red-600 text-base font-semibold text-white hover:bg-red-700 disabled:opacity-50";
  const videoMaxHeight = isHabitacion
    ? "max-h-[calc(100dvh-5rem)]"
    : "max-h-[calc(100dvh-9rem)]";

  return (
    <div
      className={`${shellClass} ${isHabitacion ? "" : "bg-slate-950"} ${isHabitacion && started ? "relative" : ""}`}
      style={shellStyle}
    >
      {!started && role === "room" && !error && (
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <button
            type="button"
            onClick={() => void startSession()}
            className={primaryBtnClass}
          >
            Iniciar videollamada
          </button>
        </div>
      )}

      {!started && error && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <p className="text-center text-sm text-red-300">{error}</p>
          {role === "staff" && onEnded && (
            <button
              type="button"
              onClick={() => onEnded()}
              className={secondaryBtnClass}
              style={
                isHabitacion
                  ? { borderColor: HABITACION_BORDER, background: "rgba(255,255,255,0.06)" }
                  : undefined
              }
            >
              Volver al dashboard
            </button>
          )}
          {role === "room" && (
            <button
              type="button"
              onClick={() => void startSession()}
              className={primaryBtnClass}
            >
              Reintentar
            </button>
          )}
        </div>
      )}

      {started && (
        <>
          {!isHabitacion && (
            <header className={headerClass}>
              {statusLabel}
            </header>
          )}

          {isHabitacion && (
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 py-3 text-center text-sm font-semibold"
              style={{ color: HABITACION_MUTED }}
            >
              {statusLabel}
            </div>
          )}

          {error && !isHabitacion && (
            <p className="shrink-0 bg-red-950 px-4 py-2 text-center text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="flex min-h-0 flex-1 items-center justify-center px-3 py-2">
            <div className={`relative aspect-video w-full max-w-5xl ${videoMaxHeight}`}>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="absolute inset-0 h-full w-full rounded-lg bg-black object-contain"
              />
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="absolute bottom-3 right-3 h-24 w-32 rounded-lg border-2 border-white/30 bg-slate-800 object-cover shadow-lg sm:h-28 sm:w-40"
              />
            </div>
          </div>

          {isHabitacion ? (
            <>
              <button
                type="button"
                onClick={() => setShowEndModal(true)}
                className="habitacion-video-end-trigger"
                style={{ background: "#ef4444" }}
              >
                Finalizar videollamada
              </button>
              <HabitacionVideoEndModal
                open={showEndModal}
                statusLabel={statusLabel}
                ending={ending}
                onEnd={() => void endCall()}
                onClose={() => setShowEndModal(false)}
              />
              <HabitacionToast
                message={error}
                variant="error"
                onDismiss={() => setError(null)}
              />
            </>
          ) : (
            <footer className={footerClass}>
              <button
                type="button"
                onClick={() => void endCall()}
                disabled={ending}
                className={endBtnClass}
              >
                {ending ? "Finalizando…" : "Finalizar llamada"}
              </button>
            </footer>
          )}
        </>
      )}
    </div>
  );
}
