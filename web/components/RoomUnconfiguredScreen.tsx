import Image from "next/image";
import { getInstitutionBrand } from "@/lib/institution-branding";
import { HABITACION_BG, HABITACION_FG, HABITACION_MUTED } from "@/lib/habitacion-theme";

export function RoomUnconfiguredScreen() {
  const { logoSrc, logoAlt } = getInstitutionBrand();

  return (
    <main
      className="flex h-full flex-col items-center justify-center px-6 text-center"
      style={{ background: HABITACION_BG, color: HABITACION_FG }}
    >
      <Image
        src={logoSrc}
        alt={logoAlt}
        width={320}
        height={48}
        priority
        className="mb-8 h-12 w-auto object-contain"
      />
      <p className="text-xl font-black text-white">Dispositivo no configurado</p>
      <p className="mt-3 max-w-sm text-base font-semibold" style={{ color: HABITACION_MUTED }}>
        Contacte a soporte técnico para activar esta tablet.
      </p>
    </main>
  );
}
