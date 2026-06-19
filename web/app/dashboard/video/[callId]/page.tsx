"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/PageHeader";
import { VideoCallSession } from "@/components/VideoCallSession";

export default function VideoCallPage() {
  const params = useParams<{ callId: string }>();
  const { token, listenConfig } = useApp();

  if (!token || !listenConfig) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <PageHeader title="Videollamada" subtitle="Sesión requerida" />
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-amber-900">
          Inicie sesión y active la escucha antes de abrir la videollamada.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block text-teal-700 hover:underline"
        >
          Volver al dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title="Videollamada"
        subtitle={`Llamado ${params.callId}`}
      />
      <VideoCallSession
        callId={params.callId}
        role="staff"
        token={token}
        listenConfig={listenConfig}
        autoStart
      />
      <Link
        href="/dashboard"
        className="mt-6 inline-block text-teal-700 hover:underline"
      >
        Volver al dashboard
      </Link>
    </main>
  );
}
