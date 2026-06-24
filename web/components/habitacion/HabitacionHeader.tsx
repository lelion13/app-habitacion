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
    <header className="flex shrink-0 items-start justify-between gap-2 px-3 pt-[max(0.35rem,env(safe-area-inset-top))] pb-1.5 sm:gap-3 sm:px-4">
      <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-3">
        <Image
          src={logoSrc}
          alt={logoAlt}
          width={160}
          height={48}
          priority
          className="h-8 w-auto max-w-[30vw] shrink-0 object-contain sm:h-9"
        />
        <div
          className="hidden h-8 w-px shrink-0 sm:block"
          style={{ background: HABITACION_DIVIDER }}
          aria-hidden
        />
        <div className="min-w-0">
          <h1 className="truncate text-lg font-black leading-tight tracking-tight text-white sm:text-xl">
            {title}
          </h1>
          <p
            className="truncate text-xs font-semibold sm:text-sm"
            style={{ color: HABITACION_MUTED }}
          >
            {subtitle}
          </p>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-2xl font-black tabular-nums leading-none text-white sm:text-3xl">
          {timeStr}
        </p>
        <p
          className="mt-0.5 max-w-[9rem] text-[0.65rem] font-semibold capitalize leading-tight sm:max-w-none sm:text-xs"
          style={{ color: HABITACION_MUTED }}
        >
          {dateStr}
        </p>
      </div>
    </header>
  );
}
