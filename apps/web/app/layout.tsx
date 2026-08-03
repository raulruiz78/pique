import type { Metadata, Viewport } from "next";
import { Inter, Sora, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

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
  themeColor: "#131313",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body
        className={`${sora.variable} ${inter.variable} ${spaceGrotesk.variable}`}
      >
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
