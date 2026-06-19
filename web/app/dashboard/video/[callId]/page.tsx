"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";

export default function VideoCallPage() {
  const params = useParams<{ callId: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("Preparando videollamada…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startPreview() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus("Videollamada activa — enlace de señalización pendiente de integración WebRTC completa.");
      } catch {
        setError("No se pudo acceder a cámara/micrófono.");
      }
    }

    void startPreview();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [params.callId]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title="Videollamada"
        subtitle={`Llamado ${params.callId}`}
      />
      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-red-700">{error}</p>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="aspect-video w-full rounded-2xl bg-slate-900 object-cover"
          />
          <p className="mt-4 text-sm text-slate-600">{status}</p>
        </>
      )}
      <Link
        href="/dashboard"
        className="mt-6 inline-block text-teal-700 hover:underline"
      >
        Volver al dashboard
      </Link>
    </main>
  );
}
