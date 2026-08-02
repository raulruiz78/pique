# Despliegue — Vercel + Supabase

## 1. Requisitos

Cuentas GitHub, Supabase y Vercel; dominio opcional. Node 24/pnpm 11 local. Verifica precios actuales en las páginas oficiales: cambian con el tiempo.

## 2. Supabase

1. Crea dos proyectos separados: staging/preview y producción.
2. Elige región UE cercana a usuarios y guarda la contraseña de base de datos en un gestor seguro.
3. Vincula el CLI: `pnpm exec supabase link --project-ref REF`.
4. Revisa: `pnpm exec supabase db diff --linked`.
5. Aplica: `pnpm exec supabase db push --linked`.
6. `db push` aplica únicamente migraciones: no carga `seed.sql`. No ejecutes `db reset` ni el seed local contra producción.

Las migraciones crean `evidence` (10 MiB) y `profile-images` (5 MiB) como buckets privados, con MIME permitidos y RLS. Realtime solo replica información necesaria para participantes, validaciones y actividad.

## 3. Auth

En Authentication → URL Configuration:

- Site URL: `https://app.tudominio.com`.
- Redirects: `https://app.tudominio.com/auth/callback` y el dominio preview controlado.
- Mantén email/password activo. Para OAuth añade proveedor, secret y callback indicado por Supabase.
- En emails usa `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`.

Comprueba protección contra contraseñas filtradas y límites de envío antes de abrir registro.

## 4. Storage y Realtime

Verifica que `evidence` sea privado. Nunca cambies a público. Una ruta siempre empieza por `auth.uid()`. Realtime solo debe replicar `challenge_participants`, `validations` y `activities`; no evidencias.

## 5. Vercel

1. Importa el repositorio.
2. Framework: Next.js; root directory: `apps/web`.
3. Install command: `cd ../.. && pnpm install --frozen-lockfile`.
4. Build command: `cd ../.. && pnpm --filter @pique/web build`.
5. Node.js: 24.x.
6. Añade las variables de `ENVIRONMENT.md`. Secret/public scope debe ser exacto.
7. Despliega Preview y prueba antes de Production.

Conecta el dominio y repite URL/callback en Supabase. Fuerza HTTPS.

## 6. Cron y trabajos

Programa `POST /api/v1/cron/maintenance` cada 15 minutos con header `Authorization: Bearer CRON_SECRET`. El job es reintentable: caduca ocurrencias, rompe rachas, finaliza retos, asigna posiciones/consecuencias y marca outbox procesada. Para volumen mayor, separa el consumidor outbox sin alterar las transacciones.

## 7. Correo transaccional

Brevo SMTP está configurado en Supabase Auth. Por control de cuota solo se usan:

- confirmación del registro;
- recuperación/cambio de contraseña solicitado por el usuario.

Los avisos de seguridad adicionales están desactivados y la aplicación no usa invitaciones por email ni magic links. Mantén desactivado el seguimiento de enlaces de Brevo para no reescribir los enlaces de Auth. Las credenciales SMTP se guardan en Supabase, nunca en Git ni en variables públicas de Vercel.

## 8. Integraciones opcionales

- Push: guarda suscripciones en `devices` y conecta Web Push/FCM al adaptador.
- Email social: reutiliza Brevo solo cuando se definan preferencias, límites y plantillas para retos/círculos.
- Sentry: añade DSN solo servidor y source maps protegidos.
- PostHog: usa host UE, consentimiento y minimización de datos.

Sin credenciales, las implementaciones no-op mantienen funcional el núcleo.

## 9. Migraciones seguras

- Una migración nueva por cambio; nunca edites una ya aplicada.
- Primero cambios aditivos compatibles, luego despliegue de app y por último limpieza.
- Haz backup/PITR antes de DDL destructivo.
- Preview usa otro proyecto: jamás una rama contra producción.
- Ejecuta RLS y flujo crítico tras cada migración.

## 10. Smoke test

1. Registro y confirmación de dos usuarios.
2. Crear círculo, copiar invitación y unirse.
3. Crear/aceptar reto y comprobar ocurrencias.
4. Subir JPEG pequeño; confirmar que bucket sigue privado.
5. Validar con el rival; verificar una sola fila ledger.
6. Abrir con un tercer usuario y confirmar 0 filas/403.
7. Ejecutar cron con secreto y comprobar cierre.
8. Instalar PWA desde móvil.
9. `PIQUE_APP_URL=https://... pnpm smoke`.

## 11. Operación y costes

Activa alertas de errores 5xx, latencia, base al 80 %, storage, Auth y cron fallido. Configura backups/PITR según plan. Retención de audit logs y evidencias debe responder a la política de privacidad. Para un MVP pequeño suelen bastar planes gratuitos o básicos de Vercel/Supabase, pero consulta sus calculadoras oficiales antes de decidir; storage/egress de fotos es la variable principal.

## 12. Rollback

- Aplicación: promueve el deployment Vercel anterior.
- Base: una migración forward correctiva es preferible. Para pérdida/corrupción, restaura backup a proyecto nuevo, valida y cambia variables.
- Rota `SUPABASE_SECRET_KEY`/`CRON_SECRET` si el incidente implica secretos.
- No reviertas columnas usadas por el deployment todavía activo.

## 13. Checklist

- [ ] CI verde y ramas protegidas.
- [ ] RLS negativa y storage firmado verificados.
- [ ] URLs Auth exactas.
- [ ] Secrets solo en servidor.
- [ ] Cron devuelve 200 y rechaza bearer incorrecto.
- [ ] Backups y alertas activos.
- [ ] Políticas legales y contacto de denuncia publicados.
- [ ] Lighthouse móvil, teclado y lector de pantalla revisados.
