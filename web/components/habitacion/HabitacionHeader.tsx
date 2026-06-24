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
    <header className="relative flex shrink-0 items-center px-6 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-4 pr-36 sm:pr-44">
        <Image
          src={logoSrc}
          alt={logoAlt}
          width={435}
          height={98}
          priority
          className="h-16 w-auto max-w-[min(435px,38vw)] shrink-0 object-contain sm:h-[98px]"
        />
        <div
          className="hidden h-12 w-px shrink-0 md:block"
          style={{ background: HABITACION_DIVIDER }}
          aria-hidden
        />
        <div className="min-w-0">
          <h1 className="truncate text-[1.875rem] font-black leading-tight tracking-tight text-white">
            {title}
          </h1>
          <p
            className="truncate text-base font-semibold"
            style={{ color: HABITACION_MUTED }}
          >
            {subtitle}
          </p>
        </div>
      </div>

      <div className="absolute top-1/2 right-6 flex -translate-y-1/2 flex-col items-center">
        <p className="text-4xl font-black tabular-nums leading-none text-white">
          {timeStr}
        </p>
        <p
          className="mt-1 rounded px-2 py-1 text-center text-sm font-semibold capitalize"
          style={{ color: HABITACION_MUTED, background: "rgba(0,0,0,0.2)" }}
        >
          {dateStr}
        </p>
      </div>
    </header>
  );
}
