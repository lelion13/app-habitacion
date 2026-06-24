"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getInstitutionBrand } from "@/lib/institution-branding";
import { HABITACION_MUTED } from "@/lib/habitacion-theme";

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
    <header className="grid shrink-0 grid-cols-[auto_1fr_auto] items-start gap-2 px-3 pt-[max(0.35rem,env(safe-area-inset-top))] pb-1.5 sm:px-4">
      <Image
        src={logoSrc}
        alt={logoAlt}
        width={160}
        height={48}
        priority
        className="h-8 w-auto max-w-[30vw] object-contain sm:h-9"
      />

      <div className="min-w-0 px-1 text-center">
        <h1 className="truncate text-lg font-black leading-tight tracking-tight text-white sm:text-xl">
          {title}
        </h1>
        <p
          className="truncate text-xs font-semibold sm:text-sm"
          style={{ color: HABITACION_MUTED }}
        >
          {subtitle}
        </p>
        <p
          className="truncate text-[0.65rem] font-semibold capitalize sm:text-xs"
          style={{ color: HABITACION_MUTED }}
        >
          {dateStr}
        </p>
      </div>

      <p className="shrink-0 text-right text-2xl font-black tabular-nums leading-none text-white sm:text-3xl">
        {timeStr}
      </p>
    </header>
  );
}
