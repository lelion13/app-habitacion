"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === "/dashboard/login";

  useEffect(() => {
    if (!loading && !user && !isLogin) {
      router.replace("/dashboard/login");
    }
  }, [loading, user, isLogin, router]);

  if (isLogin) {
    return <>{children}</>;
  }

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
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="font-semibold text-slate-900">
            Dashboard · {user.name}
          </span>
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
