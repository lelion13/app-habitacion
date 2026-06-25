import Link from "next/link";
import { InstitutionBrand } from "@/components/InstitutionBrand";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  showInstitutionLogo?: boolean;
  variant?: "light" | "staff";
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  showInstitutionLogo = false,
  variant = "staff",
}: PageHeaderProps) {
  const isStaff = variant === "staff";

  return (
    <header className="mb-6">
      {showInstitutionLogo && <InstitutionBrand className="mb-6" />}
      {backHref && (
        <Link
          href={backHref}
          className={
            isStaff
              ? "mb-4 inline-flex text-sm font-medium text-[#5ee9b5] hover:text-[#f0f4f8]"
              : "mb-4 inline-flex text-sm font-medium text-teal-700 hover:text-teal-900"
          }
        >
          ← Volver
        </Link>
      )}
      <h1
        className={
          isStaff
            ? "text-2xl font-bold tracking-tight text-[#f0f4f8] sm:text-3xl"
            : "text-3xl font-bold tracking-tight text-slate-900"
        }
      >
        {title}
      </h1>
      {subtitle && (
        <p
          className={
            isStaff
              ? "mt-2 text-base text-[#7a9ab5]"
              : "mt-2 text-base text-slate-600"
          }
        >
          {subtitle}
        </p>
      )}
    </header>
  );
}
