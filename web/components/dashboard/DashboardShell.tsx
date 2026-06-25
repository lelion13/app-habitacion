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

function ListenStatus() {
  const { listenConfig, listening } = useApp();

  if (listening && listenConfig) {
    return (
      <div className="hidden items-center gap-2 sm:flex">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5ee9b5] opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#00bc7d]" />
        </span>
        <div className="text-right text-xs leading-tight">
          <p className="font-semibold text-[#5ee9b5]">En línea</p>
          <p className="text-[#7a9ab5]">
            Piso {listenConfig.floor} · {listenConfig.sector} ·{" "}
            {ROLE_LABELS[listenConfig.role]}
          </p>
        </div>
      </div>
    );
  }

  if (listenConfig) {
    return (
      <div className="hidden items-center gap-2 sm:flex">
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <div className="text-right text-xs leading-tight">
          <p className="font-medium text-amber-200">Fuera de línea</p>
          <p className="text-[#7a9ab5]">Abra Llamador para escuchar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
      <p className="text-xs text-[#7a9ab5]">Sin escucha configurada</p>
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
