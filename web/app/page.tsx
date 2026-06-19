import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <PageHeader
          title="App Habitación"
          subtitle="Sistema de llamados hospitalarios entre habitaciones y personal de enfermería, calidad y médicos."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/habitacion"
            className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:border-teal-300 hover:shadow-md"
          >
            <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-xl text-white">
              🛏
            </span>
            <h2 className="text-xl font-bold text-slate-900 group-hover:text-teal-800">
              App Habitación
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              PWA instalable para solicitar timbre o videollamada desde la habitación.
            </p>
          </Link>

          <Link
            href="/dashboard/login"
            className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:border-teal-300 hover:shadow-md"
          >
            <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-xl text-white">
              📋
            </span>
            <h2 className="text-xl font-bold text-slate-900 group-hover:text-teal-800">
              Dashboard
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Personal que escucha y atiende llamados por piso, sector y rol.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
