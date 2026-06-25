"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useApp } from "@/context/AppContext";
import { getInstitutionBrand } from "@/lib/institution-branding";
import { hasAtLeastRole } from "@/lib/system-roles";
import { ROLE_LABELS } from "@/lib/types";
import {
  STAFF_BG,
  STAFF_FG,
  staffNavActive,
  staffNavInactive,
} from "@/lib/staff-theme";
import { UserMenu } from "./UserMenu";

interface NavItem {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
}

function OnlineDot({ color = "#00bc7d", ping = true }: { color?: string; ping?: boolean }) {
  return (
    <span className="relative inline-flex h-2 w-2 shrink-0">
      {ping && (
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
          style={{ backgroundColor: color }}
        />
      )}
      <span
        className="relative inline-flex h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
    </span>
  );
}

function ListenStatus() {
  const { listenConfig, listening } = useApp();

  if (listening && listenConfig) {
    return (
      <div className="hidden flex-col items-center sm:flex">
        <div className="flex items-center justify-center gap-1.5">
          <OnlineDot />
          <span className="text-xs font-semibold text-[#5ee9b5]">En línea</span>
        </div>
        <p className="mt-0.5 text-center text-xs text-[#7a9ab5]">
          Piso {listenConfig.floor} · Sector {listenConfig.sector} ·{" "}
          {ROLE_LABELS[listenConfig.role]}
        </p>
      </div>
    );
  }

  if (listenConfig) {
    return (
      <div className="hidden flex-col items-center sm:flex">
        <div className="flex items-center justify-center gap-1.5">
          <OnlineDot color="#fbbf24" ping={false} />
          <span className="text-xs font-medium text-amber-200">Fuera de línea</span>
        </div>
        <p className="mt-0.5 text-center text-xs text-[#7a9ab5]">
          Piso {listenConfig.floor} · Sector {listenConfig.sector} ·{" "}
          {ROLE_LABELS[listenConfig.role]}
        </p>
      </div>
    );
  }

  return (
    <div className="hidden flex-col items-center sm:flex">
      <div className="flex items-center justify-center gap-1.5">
        <OnlineDot color="rgba(255,255,255,0.25)" ping={false} />
        <span className="text-xs text-[#7a9ab5]">Sin escucha</span>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user } = useApp();
  const pathname = usePathname();
  const { logoSrc, logoAlt } = getInstitutionBrand();

  if (!user) return <>{children}</>;

  const isAdmin = user.systemRole === "admin";
  const canViewStats = hasAtLeastRole(user.systemRole, "supervisor");

  const navItems: NavItem[] = [
    {
      href: "/dashboard",
      label: "Llamador",
      match: (p) =>
        p === "/dashboard" ||
        (p.startsWith("/dashboard/") &&
          !p.startsWith("/dashboard/admin") &&
          !p.startsWith("/dashboard/login") &&
          !p.startsWith("/dashboard/video")),
    },
    ...(isAdmin
      ? [
          {
            href: "/dashboard/admin",
            label: "Administración",
            match: (p: string) => p.startsWith("/dashboard/admin"),
          },
        ]
      : []),
    ...(canViewStats
      ? [
          {
            href: "/estadisticas",
            label: "Estadísticas",
            match: (p: string) => p.startsWith("/estadisticas"),
          },
        ]
      : []),
  ];

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: STAFF_BG, color: STAFF_FG }}
    >
      <header className="shrink-0 border-b border-white/[0.08]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/dashboard" className="shrink-0">
            <Image
              src={logoSrc}
              alt={logoAlt}
              width={280}
              height={64}
              priority
              className="h-12 w-auto max-w-[min(280px,42vw)] object-contain sm:h-14"
            />
          </Link>
          <div className="flex items-center gap-3">
            <ListenStatus />
            <UserMenu />
          </div>
        </div>

        <nav
          className="mx-auto flex max-w-6xl flex-wrap gap-1 px-4 pb-3"
          aria-label="Secciones del dashboard"
        >
          {navItems.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? staffNavActive : staffNavInactive}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="flex-1">{children}</div>
    </div>
  );
}
