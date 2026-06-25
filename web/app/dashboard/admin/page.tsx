"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { AdminPanel } from "@/components/admin/AdminPanel";

export default function AdminPage() {
  const { user, loading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && user.systemRole !== "admin") {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div
        className="flex min-h-[40vh] items-center justify-center"
        style={{ color: "#7a9ab5" }}
      >
        <p>Cargando…</p>
      </div>
    );
  }

  if (user.systemRole !== "admin") {
    return null;
  }

  return <AdminPanel />;
}
