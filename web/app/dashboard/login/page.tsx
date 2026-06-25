"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useApp } from "@/context/AppContext";
import { getInstitutionBrand } from "@/lib/institution-branding";
import {
  STAFF_BG,
  STAFF_FG,
  staffBtnPrimary,
  staffCard,
  staffError,
  staffInput,
  staffLabel,
} from "@/lib/staff-theme";

export default function DashboardLoginPage() {
  const { login, user, loading } = useApp();
  const router = useRouter();
  const { logoSrc, logoAlt } = getInstitutionBrand();
  const [email, setEmail] = useState("admin@hospital.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  if (loading || user) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: STAFF_BG, color: STAFF_FG }}
      >
        <p className="text-[#7a9ab5]">{user ? "Redirigiendo…" : "Cargando…"}</p>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const err = await login(email, password);
    if (err) {
      setError(err);
      setSubmitting(false);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: STAFF_BG, color: STAFF_FG }}
    >
      <div className={`w-full max-w-md p-8 ${staffCard}`}>
        <div className="mb-6 flex justify-center">
          <Image
            src={logoSrc}
            alt={logoAlt}
            width={280}
            height={64}
            priority
            className="h-14 w-auto object-contain"
          />
        </div>
        <h1 className="text-center text-2xl font-bold text-[#f0f4f8]">Dashboard</h1>
        <p className="mt-2 text-center text-sm text-[#7a9ab5]">
          Inicie sesión para escuchar llamados
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className={staffLabel}>
              Correo
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-1 w-full ${staffInput}`}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className={staffLabel}>
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mt-1 w-full ${staffInput}`}
              required
            />
          </div>
          {error && <p className={staffError}>{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 ${staffBtnPrimary}`}
          >
            {submitting ? "Entrando…" : "Iniciar sesión"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[#7a9ab5]">
          <Link href="/" className="text-[#5ee9b5] hover:underline">
            Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
