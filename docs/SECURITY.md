# Seguridad

## Modelo

El atacante puede manipular cliente, payload, user ID, timestamps y reintentos. Por eso la autoridad reside en PostgreSQL: `auth.uid()`, hora de servidor, RLS, constraints y funciones transaccionales.

Controles incluidos:

- cookies SSR/PKCE y refresh en Proxy;
- CSP, anti-framing, nosniff y permissions policy;
- validación Zod y errores sin detalles internos;
- rate limit local y punto de sustitución por KV;
- storage privado, URL de subida firmada, path por usuario, MIME y 10 MiB;
- ledger único e inmutable para el cliente;
- idempotency keys y versiones;
- audit/outbox sin tokens ni contenido privado;
- pruebas negativas RLS en Vitest y pgTAP.

El service role nunca debe usar prefijo `NEXT_PUBLIC_`. Las URLs firmadas no se registran. Para una vulnerabilidad, contacta al mantenedor por un canal privado; no abras un issue con datos de usuarios.

## Moderación

Se prohíben castigos peligrosos, ilegales, sexuales no consentidos, humillantes, relacionados con sustancias, acoso, acceso a cuentas, exposición privada o dinero elevado. Existen endpoints de bloqueo/denuncia; la operación debe definir SLA y revisión humana antes de producción.

## Antes de producción

Sustituye el limitador en memoria por uno distribuido, activa protección de contraseñas filtradas, revisa CSP con integraciones reales, ejecuta escaneo de dependencias/secretos y realiza una revisión externa de RLS.
