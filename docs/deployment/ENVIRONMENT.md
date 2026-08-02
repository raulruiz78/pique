# Variables de entorno

| Variable                               | Ámbito           | Obligatoria | Descripción                                  |
| -------------------------------------- | ---------------- | ----------: | -------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                  | público          |          sí | origen canónico, sin barra final             |
| `NEXT_PUBLIC_SUPABASE_URL`             | público          |          sí | URL del proyecto                             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | público          |          sí | clave pública limitada por RLS               |
| `SUPABASE_SECRET_KEY`                  | secreto servidor |  producción | cron/finalización; jamás navegador           |
| `CRON_SECRET`                          | secreto servidor |  producción | bearer aleatorio de 24+ caracteres           |
| `SIGNED_URL_TTL_SECONDS`               | servidor         |          no | TTL, por defecto 300                         |
| `MAX_EVIDENCE_BYTES`                   | servidor         |          no | máximo, por defecto 10 MiB                   |
| `RATE_LIMIT_PROVIDER`                  | servidor         |          no | `memory` local; KV recomendado en producción |
| `SENTRY_DSN`                           | secreto servidor |          no | adaptador de errores                         |
| `NEXT_PUBLIC_POSTHOG_KEY`              | público          |          no | analítica consentida                         |
| `NEXT_PUBLIC_POSTHOG_HOST`             | público          |          no | endpoint regional de PostHog                 |
| `RESEND_API_KEY`                       | secreto servidor |          no | correo transaccional                         |
| `EMAIL_FROM`                           | servidor         |          no | remitente verificado                         |

Las variables `NEXT_PUBLIC_*` terminan en el bundle y nunca deben contener secretos. En Vercel separa Preview y Production. Rota inmediatamente una secret expuesta y revisa el audit log.
