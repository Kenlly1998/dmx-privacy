import type { Metadata, Viewport } from "next";
import { Shell } from "@/components/Shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "KLA PRO CRM",
  description:
    "CRM de KLA PRO: pipeline, cotizaciones, pagos y canales (WhatsApp, Instagram, Grok).",
  applicationName: "KLAPRO",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "KLA PRO CRM",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#09060a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
