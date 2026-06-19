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
import type { AuthUser, ListenConfig } from "@/lib/types";

interface AppContextValue {
  user: AuthUser | null;
  token: string | null;
  listenConfig: ListenConfig | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  setListenConfig: (config: ListenConfig | null) => void;
  saveListenConfig: (config: ListenConfig) => Promise<string | null>;
}

const AppContext = createContext<AppContextValue | null>(null);

const TOKEN_KEY = "app_habitacion_token";
const LISTEN_KEY = "app_habitacion_listen";

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [listenConfig, setListenConfigState] = useState<ListenConfig | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedListen = localStorage.getItem(LISTEN_KEY);

    if (storedListen) {
      try {
        setListenConfigState(JSON.parse(storedListen) as ListenConfig);
      } catch {
        localStorage.removeItem(LISTEN_KEY);
      }
    }

    if (!storedToken) {
      setLoading(false);
      return;
    }

    fetch("/api/auth/login", {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("invalid");
        const data = (await res.json()) as { user: AuthUser };
        setToken(storedToken);
        setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json()) as {
      error?: string;
      token?: string;
      user?: AuthUser;
    };
    if (!res.ok) return data.error ?? "Error al iniciar sesión";
    localStorage.setItem(TOKEN_KEY, data.token!);
    setToken(data.token!);
    setUser(data.user!);
    return null;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LISTEN_KEY);
    setToken(null);
    setUser(null);
    setListenConfigState(null);
  }, []);

  const setListenConfig = useCallback((config: ListenConfig | null) => {
    if (config) {
      localStorage.setItem(LISTEN_KEY, JSON.stringify(config));
    } else {
      localStorage.removeItem(LISTEN_KEY);
    }
    setListenConfigState(config);
  }, []);

  const saveListenConfig = useCallback(
    async (config: ListenConfig) => {
      if (!token) return "No autenticado";
      const res = await fetch("/api/staff/session", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) return data.error ?? "Error al guardar";
      setListenConfig(config);
      return null;
    },
    [token, setListenConfig],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      listenConfig,
      loading,
      login,
      logout,
      setListenConfig,
      saveListenConfig,
    }),
    [
      user,
      token,
      listenConfig,
      loading,
      login,
      logout,
      setListenConfig,
      saveListenConfig,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
