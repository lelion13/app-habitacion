"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { hasAtLeastRole } from "@/lib/system-roles";
import { STAFF_BG, STAFF_FG } from "@/lib/staff-theme";

export default function EstadisticasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/dashboard/login");
      return;
    }
    if (
      !loading &&
      user &&
      !hasAtLeastRole(user.systemRole, "supervisor")
    ) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  if (loading || !user || !hasAtLeastRole(user.systemRole, "supervisor")) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: STAFF_BG, color: STAFF_FG }}
      >
        <p className="text-[#7a9ab5]">Cargando…</p>
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
