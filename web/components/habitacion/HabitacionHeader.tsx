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
    <header className="flex shrink-0 items-center justify-between gap-3 px-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <Image
          src={logoSrc}
          alt={logoAlt}
          width={200}
          height={56}
          priority
          className="h-11 w-auto max-w-[34vw] shrink-0 object-contain sm:h-14"
        />
        <div
          className="hidden h-12 w-px shrink-0 sm:block"
          style={{ background: HABITACION_DIVIDER }}
          aria-hidden
        />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
            {title}
          </h1>
          <p
            className="truncate text-sm font-semibold sm:text-base"
            style={{ color: HABITACION_MUTED }}
          >
            {subtitle}
          </p>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-3xl font-black tabular-nums leading-none text-white sm:text-4xl">
          {timeStr}
        </p>
        <p
          className="mt-1 max-w-[10rem] text-xs font-semibold capitalize leading-tight sm:text-sm"
          style={{ color: HABITACION_MUTED }}
        >
          {dateStr}
        </p>
      </div>
    </header>
  );
}
