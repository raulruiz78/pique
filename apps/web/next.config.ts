import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : "";

const config: NextConfig = {
  transpilePackages: [
    "@pique/domain",
    "@pique/validation",
    "@pique/database",
    "@pique/config",
    "@pique/ui",
  ],
  typedRoutes: true,
  // Todas las rutas bajo (app) ya son dinámicas por sí mismas (usan
  // cookies() a través del cliente de Supabase para saber quién ha
  // iniciado sesión), así que el Router Cache del cliente parte de 0s por
  // defecto: cada vez que se revisita una pestaña ya vista hace un
  // instante, se vuelve a pedir todo desde cero. 30s deja que cambiar
  // entre Hoy/Calendario/Círculos varias veces en la misma sesión se
  // sienta instantáneo la segunda vez, sin afectar a las mutaciones: los
  // router.refresh() tras cada acción (check-in, reacción, etc.) siguen
  // invalidando la caché y pidiendo datos frescos de inmediato.
  experimental: {
    staleTimes: {
      dynamic: 30,
    },
  },
  images: {
    remotePatterns: supabaseUrl
      ? [
          {
            protocol: new URL(supabaseUrl).protocol.replace(":", "") as
              "http" | "https",
            hostname: new URL(supabaseUrl).hostname,
            port: new URL(supabaseUrl).port,
            pathname: "/storage/v1/object/sign/**",
          },
        ]
      : [],
  },
  async headers() {
    const connect = ["'self'", supabaseOrigin, "https://*.posthog.com"]
      .filter(Boolean)
      .join(" ");
    const developmentEval =
      process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline'${developmentEval}; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: ${supabaseOrigin}; connect-src ${connect}; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'${process.env.NODE_ENV === "production" ? "; upgrade-insecure-requests" : ""}`,
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default config;
