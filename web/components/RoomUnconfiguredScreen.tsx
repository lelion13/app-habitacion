export function RoomUnconfiguredScreen() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <p className="text-xl font-semibold text-slate-900">
        Dispositivo no configurado
      </p>
      <p className="mt-3 max-w-sm text-base text-slate-600">
        Contacte a soporte técnico para activar esta tablet.
      </p>
    </main>
  );
}
