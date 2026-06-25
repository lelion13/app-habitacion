"use client";

import { useCallback, useEffect, useState } from "react";

export interface TelegramStatus {
  linked: boolean;
  username: string | null;
  notifyEnabled: boolean;
}

export function useTelegramLink(token: string | null) {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    if (!token) return;
    const res = await fetch("/api/staff/telegram", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setStatus((await res.json()) as TelegramStatus);
    }
  }, [token]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const connect = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/telegram/link", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { error?: string; url?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "No se pudo generar el enlace");
      }
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error Telegram");
    } finally {
      setBusy(false);
    }
  }, [token]);

  const disconnect = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    await fetch("/api/staff/telegram", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await loadStatus();
    setBusy(false);
  }, [token, loadStatus]);

  return { status, busy, error, connect, disconnect, reload: loadStatus };
}
