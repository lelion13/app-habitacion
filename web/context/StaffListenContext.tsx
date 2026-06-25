"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useApp } from "@/context/AppContext";
import {
  playBell,
  playVideoAlert,
  stopAlertLoop,
  syncAlertLoop,
} from "@/lib/bell";
import { enableAlertAudio, wasAudioUnlockedThisSession } from "@/lib/audio-alert-session";
import { matchesListenTarget, resolveAlertKind } from "@/lib/calls";
import type { CallStatus, CallType, StaffRole } from "@/lib/types";

export interface StaffActiveCall {
  id: string;
  roomNumber: string;
  floor: string;
  sector: string;
  type: CallType;
  targetRole: StaffRole;
  status: string;
  createdAt: string;
}

interface StaffListenContextValue {
  calls: StaffActiveCall[];
  pendingForListen: StaffActiveCall[];
  audioReady: boolean;
  enableAudioAlert: () => Promise<void>;
  setCallFromServer: (call: StaffActiveCall) => void;
  clearCalls: () => void;
}

const StaffListenContext = createContext<StaffListenContextValue | null>(null);

export function StaffListenProvider({ children }: { children: ReactNode }) {
  const { token, listenConfig, setListening } = useApp();
  const [calls, setCalls] = useState<StaffActiveCall[]>([]);
  const [audioReady, setAudioReady] = useState(false);

  const loadCalls = useCallback(async () => {
    if (!token || !listenConfig) return;
    const params = new URLSearchParams({
      floor: listenConfig.floor,
      sector: listenConfig.sector,
      role: listenConfig.role,
    });
    const res = await fetch(`/api/calls?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = (await res.json()) as { calls: StaffActiveCall[] };
    setCalls(data.calls);
  }, [token, listenConfig]);

  const clearCalls = useCallback(() => {
    setCalls([]);
  }, []);

  const setCallFromServer = useCallback((call: StaffActiveCall) => {
    setCalls((prev) =>
      call.status === "completed" || call.status === "cancelled"
        ? prev.filter((c) => c.id !== call.id)
        : prev.map((c) => (c.id === call.id ? call : c)),
    );
  }, []);

  const enableAudioAlert = useCallback(async () => {
    await enableAlertAudio(setAudioReady);
  }, []);

  useEffect(() => {
    if (!listenConfig) {
      setCalls([]);
      setListening(false);
      return;
    }
    void loadCalls();
  }, [listenConfig, loadCalls, setListening]);

  useEffect(() => {
    if (!token || !listenConfig) return;

    const poll = window.setInterval(() => {
      void loadCalls();
    }, 4000);

    return () => window.clearInterval(poll);
  }, [token, listenConfig, loadCalls]);

  useEffect(() => {
    if (!token || !listenConfig) {
      setListening(false);
      return;
    }

    const params = new URLSearchParams({
      floor: listenConfig.floor,
      sector: listenConfig.sector,
      role: listenConfig.role,
    });

    const source = new EventSource(
      `/api/calls/stream?${params.toString()}&token=${encodeURIComponent(token)}`,
    );

    setListening(true);

    source.addEventListener("call:new", (event) => {
      const call = JSON.parse(event.data) as StaffActiveCall;
      setCalls((prev) => [call, ...prev.filter((c) => c.id !== call.id)]);
    });

    source.addEventListener("call:updated", (event) => {
      const call = JSON.parse(event.data) as StaffActiveCall;
      setCalls((prev) =>
        call.status === "completed" || call.status === "cancelled"
          ? prev.filter((c) => c.id !== call.id)
          : prev.map((c) => (c.id === call.id ? call : c)),
      );
    });

    return () => {
      source.close();
      setListening(false);
    };
  }, [token, listenConfig, setListening]);

  const pendingForListen = useMemo(() => {
    if (!listenConfig) return [];
    return calls.filter((call) =>
      matchesListenTarget(
        {
          floor: call.floor,
          sector: call.sector,
          targetRole: call.targetRole,
          status: call.status as CallStatus,
        },
        listenConfig.floor,
        listenConfig.sector,
        listenConfig.role,
      ),
    );
  }, [calls, listenConfig]);

  useEffect(() => {
    if (!audioReady || pendingForListen.length === 0) {
      syncAlertLoop(null);
      return;
    }
    syncAlertLoop(resolveAlertKind(pendingForListen));
    return () => stopAlertLoop();
  }, [audioReady, pendingForListen]);

  useEffect(() => {
    if (!listenConfig || audioReady || pendingForListen.length === 0) return;
    if (!wasAudioUnlockedThisSession()) return;

    const tryResume = () => {
      void enableAudioAlert();
    };
    window.addEventListener("pointerdown", tryResume, { once: true });
    window.addEventListener("keydown", tryResume, { once: true });
    return () => {
      window.removeEventListener("pointerdown", tryResume);
      window.removeEventListener("keydown", tryResume);
    };
  }, [listenConfig, audioReady, pendingForListen.length, enableAudioAlert]);

  const value = useMemo(
    () => ({
      calls,
      pendingForListen,
      audioReady,
      enableAudioAlert,
      setCallFromServer,
      clearCalls,
    }),
    [
      calls,
      pendingForListen,
      audioReady,
      enableAudioAlert,
      setCallFromServer,
      clearCalls,
    ],
  );

  return (
    <StaffListenContext.Provider value={value}>
      {children}
    </StaffListenContext.Provider>
  );
}

export function useStaffListen() {
  const ctx = useContext(StaffListenContext);
  if (!ctx) {
    throw new Error("useStaffListen must be used within StaffListenProvider");
  }
  return ctx;
}
