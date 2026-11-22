import type { Metadata, Viewport } from "next";
import { Shell } from "@/components/Shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ventas CRM",
  description:
    "CRM multiplataforma para pipeline, cotizaciones, pagos y canales (WhatsApp, Instagram, Grok).",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Ventas CRM",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b4f6c",
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
