# Arquitectura

## Contexto

Pique es un monolito modular desplegado como una aplicación Next.js. Supabase aporta Auth, PostgreSQL, Storage y Realtime. Esta decisión mantiene transacciones fuertes en el núcleo sin impedir reutilizar el dominio en una futura app móvil.

```text
Presentación (App Router / componentes)
        ↓
Aplicación (Route Handlers / casos de uso)
        ↓
Dominio (módulos TypeScript puros)
        ↓
Infraestructura (Supabase / adaptadores externos)
```

## Límites

- `packages/domain` no importa React ni Supabase.
- `packages/validation` contiene los contratos de entrada.
- Las Route Handlers autentican, validan y llaman a funciones PostgreSQL.
- PostgreSQL controla hora, permisos, transiciones, idempotencia y puntos.
- RLS limita también las consultas realizadas directamente con el SDK.
- El service role solo está disponible en cron y servidor.

## Escrituras críticas

`create_challenge`, `respond_to_challenge`, `submit_check_in`, `review_check_in` y `complete_challenge` son transaccionales. El ledger usa `UNIQUE(user_id, source_type, source_id, reason)`; reintentar una revisión no duplica puntos. Los efectos secundarios se registran en `outbox_events` en la misma transacción.

## Tiempo y recurrencia

El dominio prueba RRULE diaria/semanal y un horizonte inclusivo de 30 días. PostgreSQL genera ocurrencias cuando todos aceptan. Las ventanas usan `timestamptz` y hora de servidor. Un job futuro puede extender el horizonte idempotentemente.

## Tiempo real y offline

Realtime se limita a participantes/ranking, validaciones y actividad. La lectura normal usa SSR y caché estándar. El service worker cachea el shell; un check-in sin conexión conserva borrador local, pero nunca asigna puntos antes de confirmación.

## Adaptadores

Analítica, correo/push y reporte de errores están definidos por interfaces con implementaciones no-op locales en `apps/web/lib/integrations.ts`. El rate limiter en memoria protege el modo local; producción debe conectar Upstash/Vercel KV mediante el mismo límite conceptual.
