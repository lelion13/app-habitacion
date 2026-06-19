import Link from "next/link";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
}

export function PageHeader({ title, subtitle, backHref }: PageHeaderProps) {
  return (
    <header className="mb-8">
      {backHref && (
        <Link
          href={backHref}
          className="mb-4 inline-flex text-sm font-medium text-teal-700 hover:text-teal-900"
        >
          ← Volver
        </Link>
      )}
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
      {subtitle && (
        <p className="mt-2 text-base text-slate-600">{subtitle}</p>
      )}
    </header>
  );
}
