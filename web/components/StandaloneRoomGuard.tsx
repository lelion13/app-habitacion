"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  habitacionPathForKey,
  isStandalonePwa,
  readStoredRoomKey,
} from "@/lib/room-bind";

function shouldGuardPath(pathname: string): boolean {
  if (pathname.startsWith("/habitacion")) return false;
  if (pathname.startsWith("/api")) return false;
  return (
    pathname === "/" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/estadisticas")
  );
}

export function StandaloneRoomGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isStandalonePwa() || !shouldGuardPath(pathname)) return;

    const storedKey = readStoredRoomKey();
    router.replace(storedKey ? habitacionPathForKey(storedKey) : "/habitacion");
  }, [pathname, router]);

  return null;
}
