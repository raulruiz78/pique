import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Pique — Que gane la constancia", template: "%s · Pique" },
  description: "Retos privados con amigos, reglas claras y el pique justo.",
  applicationName: "Pique",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Pique",
    statusBarStyle: "black-translucent",
  },
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#6d35ff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
