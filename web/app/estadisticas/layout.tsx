"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function EstadisticasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/dashboard/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-900">
              Estadísticas · {user.name}
            </span>
            <Link
              href="/dashboard"
              className={`text-sm font-medium ${pathname === "/dashboard" ? "text-teal-800" : "text-teal-700 hover:text-teal-900"}`}
            >
              Dashboard
            </Link>
            <Link
              href="/estadisticas"
              className={`text-sm font-medium ${pathname === "/estadisticas" ? "text-teal-800 underline" : "text-teal-700 hover:text-teal-900"}`}
            >
              Estadísticas
            </Link>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/dashboard/login");
            }}
            className="text-sm font-medium text-teal-700 hover:text-teal-900"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>
      {children}
    </div>
  );
}
