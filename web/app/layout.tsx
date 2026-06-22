import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { AppProvider } from "@/context/AppContext";
import { StandaloneRoomGuard } from "@/components/StandaloneRoomGuard";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "App Habitación",
  description: "Llamados hospitalarios desde habitación a enfermería, calidad y médicos",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "App Habitación",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <AppProvider>
          <StandaloneRoomGuard />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
