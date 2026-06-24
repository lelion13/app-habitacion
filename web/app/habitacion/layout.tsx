import { Nunito } from "next/font/google";
import type { Viewport } from "next";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

export const viewport: Viewport = {
  themeColor: "#0d1b2a",
};

export default function HabitacionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`${nunito.className} min-h-screen`}>{children}</div>;
}
