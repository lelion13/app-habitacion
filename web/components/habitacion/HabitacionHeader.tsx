"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getInstitutionBrand } from "@/lib/institution-branding";
import { HABITACION_DIVIDER, HABITACION_MUTED } from "@/lib/habitacion-theme";

interface HabitacionHeaderProps {
  title: string;
  subtitle: string;
}

function useClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return now;
}

export function HabitacionHeader({ title, subtitle }: HabitacionHeaderProps) {
  const { logoSrc, logoAlt } = getInstitutionBrand();
  const now = useClock();

  const timeStr = now.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = now.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
      <div className="flex min-w-0 items-start gap-4">
        <Image
          src={logoSrc}
          alt={logoAlt}
          width={160}
          height={48}
          priority
          className="h-12 w-auto shrink-0 object-contain"
        />
        <div
          className="hidden h-10 w-px shrink-0 sm:block"
          style={{ background: HABITACION_DIVIDER }}
          aria-hidden
        />
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-white leading-none">
            {title}
          </h1>
          <p className="mt-1 text-sm font-semibold" style={{ color: HABITACION_MUTED }}>
            {subtitle}
          </p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-4xl font-black tabular-nums leading-none text-white">
          {timeStr}
        </p>
        <p
          className="mt-1 text-sm font-semibold capitalize"
          style={{ color: HABITACION_MUTED }}
        >
          {dateStr}
        </p>
      </div>
    </header>
  );
}
