import Image from "next/image";
import { getInstitutionBrand } from "@/lib/institution-branding";

interface InstitutionBrandProps {
  className?: string;
}

export function InstitutionBrand({ className = "" }: InstitutionBrandProps) {
  const { logoSrc, logoAlt } = getInstitutionBrand();

  return (
    <div className={`flex justify-center ${className}`}>
      <div className="rounded-xl bg-black px-4 py-2.5 shadow-sm ring-1 ring-slate-300/40">
        <Image
          src={logoSrc}
          alt={logoAlt}
          width={320}
          height={48}
          priority
          className="h-10 w-auto max-w-[min(100%,20rem)] object-contain sm:h-11"
        />
      </div>
    </div>
  );
}
