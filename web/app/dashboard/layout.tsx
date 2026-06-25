"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { STAFF_BG, STAFF_FG } from "@/lib/staff-theme";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === "/dashboard/login";
  const isVideo = pathname.startsWith("/dashboard/video/");

  useEffect(() => {
    if (!loading && !user && !isLogin) {
      router.replace("/dashboard/login");
    }
  }, [loading, user, isLogin, router]);

  if (isLogin) {
    return <>{children}</>;
  }

  if (isVideo) {
    return <>{children}</>;
  }

  if (loading || !user) {
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
