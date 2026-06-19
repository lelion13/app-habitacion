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

type ConnectionState = "idle" | "connecting" | "connected" | "error";

interface VideoCallSessionProps {
  callId: string;
  role: "room" | "staff";
  roomKey?: string;
  token?: string;
  listenConfig?: ListenConfig;
  roomId?: string;
  fullscreen?: boolean;
  autoStart?: boolean;
  onEnded?: () => void;
}

function signalKey(message: WebRtcSignalMessage): string {
  return `${message.from}:${message.type}:${message.payload.slice(0, 48)}`;
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
}: VideoCallSessionProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescSetRef = useRef(false);
  const processedSignalsRef = useRef(new Set<string>());
  const sessionActiveRef = useRef(false);

  const [connectionState, setConnectionState] =
    useState<ConnectionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(autoStart);

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

  useEffect(() => cleanup, [cleanup]);

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

  const addIceCandidate = useCallback(
    async (payload: string) => {
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
    },
    [],
  );

  const handleRemoteStream = useCallback((stream: MediaStream) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
    }
    setConnectionState("connected");
  }, []);

  const handleSignal = useCallback(
    async (message: WebRtcSignalMessage) => {
      if (message.callId !== callId) return;
      if (message.from === role) return;

      const key = signalKey(message);
      if (processedSignalsRef.current.has(key)) return;

      if (message.type === "offer" && role === "staff") {
        if (!sessionActiveRef.current) return;

        const activePc = pcRef.current;
        if (!activePc) return;

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
        const activePc = pcRef.current;
        if (!activePc) return;

        await activePc.setRemoteDescription({
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
      await handleSignal(signal);
    }
  }, [callId, handleSignal, role, roomKey, token]);

  const ensurePeer = useCallback(() => {
    if (pcRef.current) return pcRef.current;

    const pc = createPeerConnection({
      onRemoteStream: handleRemoteStream,
      onIceCandidate: (candidate) => {
        void postSignal("ice", JSON.stringify(candidate));
      },
    });

    pcRef.current = pc;
    return pc;
  }, [handleRemoteStream, postSignal]);

  const startSession = useCallback(async () => {
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

  useEffect(() => {
    if (!started || !sessionActiveRef.current) return;

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
      void handleSignal(message);
    };

    source.addEventListener("webrtc:signal", onSignal);

    return () => {
      source.removeEventListener("webrtc:signal", onSignal);
      source.close();
    };
  }, [started, role, roomId, listenConfig, token, handleSignal]);

  useEffect(() => {
    if (autoStart) {
      void startSession();
    }
  }, [autoStart, startSession]);

  const statusLabel =
    connectionState === "connected"
      ? "Videollamada conectada"
      : connectionState === "connecting"
        ? "Conectando…"
        : connectionState === "error"
          ? (error ?? "Error de conexión")
          : "Listo para iniciar";

  const containerClass = fullscreen
    ? "fixed inset-0 z-50 flex flex-col bg-slate-950 px-4 py-6"
    : "flex flex-col";

  return (
    <div className={containerClass}>
      {!started && role === "room" && (
        <button
          type="button"
          onClick={() => void startSession()}
          className="mb-4 rounded-xl bg-violet-600 px-6 py-4 text-lg font-semibold text-white hover:bg-violet-700"
        >
          Iniciar videollamada
        </button>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {started && (
        <div className="relative flex-1">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="h-full min-h-[240px] w-full rounded-2xl bg-slate-900 object-cover"
          />
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="absolute bottom-4 right-4 h-28 w-40 rounded-xl border-2 border-white/30 bg-slate-800 object-cover shadow-lg sm:h-36 sm:w-48"
          />
        </div>
      )}

      {started && (
        <p className="mt-4 text-center text-sm text-slate-300 sm:text-slate-600">
          {statusLabel}
        </p>
      )}
    </div>
  );
}
