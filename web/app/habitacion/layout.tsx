import { Nunito } from "next/font/google";
import type { Viewport } from "next";
import "./habitacion.css";

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
  return (
    <div className={`habitacion-root ${nunito.className}`}>{children}</div>
  );
}
