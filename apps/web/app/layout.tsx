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
  interactiveWidget: "resizes-content",
};

// iOS Safari no genera splash screens desde el manifest: requiere un
// <link rel="apple-touch-startup-image"> por combinación de tamaño/densidad.
// Los archivos se generan con `pnpm generate:splash` (scripts/generate-splash.mjs).
const APPLE_SPLASH_SCREENS = [
  {
    width: 320,
    height: 568,
    ratio: 2,
    file: "apple-splash-iphone-se-640x1136.png",
  },
  {
    width: 375,
    height: 667,
    ratio: 2,
    file: "apple-splash-iphone-8-750x1334.png",
  },
  {
    width: 390,
    height: 844,
    ratio: 3,
    file: "apple-splash-iphone-12-13-14-1170x2532.png",
  },
  {
    width: 393,
    height: 852,
    ratio: 3,
    file: "apple-splash-iphone-14-15-pro-1179x2556.png",
  },
  {
    width: 430,
    height: 932,
    ratio: 3,
    file: "apple-splash-iphone-14-15-pro-max-1290x2796.png",
  },
  {
    width: 428,
    height: 926,
    ratio: 3,
    file: "apple-splash-iphone-12-13-pro-max-1284x2778.png",
  },
  {
    width: 810,
    height: 1080,
    ratio: 2,
    file: "apple-splash-ipad-10-2-1620x2160.png",
  },
  {
    width: 834,
    height: 1194,
    ratio: 2,
    file: "apple-splash-ipad-pro-11-1668x2388.png",
  },
  {
    width: 1024,
    height: 1366,
    ratio: 2,
    file: "apple-splash-ipad-pro-12-9-2048x2732.png",
  },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <head>
        {APPLE_SPLASH_SCREENS.map((screen) => (
          <link
            key={screen.file}
            rel="apple-touch-startup-image"
            href={`/splash/${screen.file}`}
            media={`(device-width: ${screen.width}px) and (device-height: ${screen.height}px) and (-webkit-device-pixel-ratio: ${screen.ratio}) and (orientation: portrait)`}
          />
        ))}
      </head>
      <body
        className={`${sora.variable} ${inter.variable} ${spaceGrotesk.variable}`}
      >
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
