"use client";

import type { ReactNode } from "react";
import { StaffListenProvider } from "@/context/StaffListenContext";

export function StaffListenBridge({ children }: { children: ReactNode }) {
  return <StaffListenProvider>{children}</StaffListenProvider>;
}
