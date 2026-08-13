# Pique

PWA privada y mobile-first para convertir objetivos cotidianos en retos compartidos. Incluye reglas aceptadas, calendario, evidencia fotográfica privada, validación social, ledger de puntos, ranking, rachas y consecuencias no monetarias.

Versión actual: **0.5.0**. Consulta [CHANGELOG.md](CHANGELOG.md).

## Experiencia actual

- Inicio diario con objetivos, racha, puntos y validaciones laterales.
- Calendario mensual interactivo y agenda futura sin ocurrencias pasadas.
- Retos categorizados con ritmos fijos, flexibles o varias veces al día.
- Círculos privados o públicos; el creador aprueba todas las solicitudes de acceso.
- Podios globales y marcadores independientes por reto.
- Niveles, rangos y logros calculados desde actividad real.
- Evidencia fotográfica privada y validación social en una cola dedicada.

## Inicio rápido

Requisitos: Node.js 24 LTS, pnpm 11, Docker Desktop y Supabase CLI (incluida como dependencia).

```bash
node --version
npm install --global pnpm@11.18.0
pnpm --version
pnpm install
pnpm db:start
pnpm db:reset
cp -n .env.example apps/web/.env.local
pnpm dev
```

Después de `pnpm db:start`, copia `API URL`, `Publishable key` (o anon key local) y `Secret key` (o service role local) a `apps/web/.env.local`. Abre <http://localhost:3000>.

Si `node --version` es inferior a 24, instala primero Node 24 con tu gestor de versiones (`nvm install 24 && nvm use 24`). Evita el paquete antiguo `nodejs` de Ubuntu para este proyecto.

Usuarios locales:

- `raul@pique.local` / `PiqueDemo2026!`
- `carmen@pique.local` / `PiqueDemo2026!`

Estas credenciales solo existen en el seed local. No deben usarse en producción.

## Comandos

```bash
pnpm dev             # Next.js
pnpm lint            # ESLint
pnpm typecheck       # TypeScript estricto
pnpm test            # dominio, componentes e integración
pnpm test:e2e        # camino crítico con Playwright
pnpm build           # build de producción
pnpm db:reset        # migraciones + seed
pnpm smoke           # app y manifest
```

Las pruebas de integración se omiten si no existen las tres variables de Supabase; con el stack local levantado se ejecutan completas. Las pruebas SQL/RLS se ejecutan con `pnpm exec supabase test db`.

## Arquitectura

Monorepo pnpm con Next.js 16, React 19, TypeScript, Tailwind 4, Supabase y módulos puros de dominio. El cliente nunca decide puntos, ganadores ni permisos: las mutaciones críticas son funciones PostgreSQL transaccionales y RLS es la segunda barrera.

- `apps/web`: presentación, API y adaptadores Supabase.
- `packages/domain`: estados, puntuación, recurrencia, rachas y ranking puros.
- `packages/validation`: contratos Zod compartidos.
- `packages/database`: contratos de transporte.
- `supabase`: esquema, RLS, funciones, storage y seed.
- `tests`: integración y E2E.
- `docs`: arquitectura, seguridad y despliegue.

Consulta [arquitectura](docs/architecture/ARCHITECTURE.md), [desarrollo local](docs/deployment/LOCAL.md) y [despliegue](docs/deployment/DEPLOYMENT.md).

## Servicios de producción

- **Vercel:** despliega automáticamente el contenido protegido de `main`.
- **Supabase:** Auth, PostgreSQL, RLS, cron y Storage privado.
- **Brevo:** SMTP transaccional limitado de momento a confirmar el registro y recuperar la contraseña. El seguimiento de enlaces debe permanecer desactivado.
- **GitHub:** PR, checks, ramas protegidas, etiquetas y releases.

Las imágenes de evidencias, perfiles y círculos son privadas. No se guardan URLs públicas: la aplicación comprueba la sesión y la relación con el círculo antes de entregar cada archivo.

## Versionado y despliegues

Los cambios llegan a producción exclusivamente mediante PR a `main`. CI valida formato, lint, tipos, tests, compilación, migraciones y E2E; Vercel genera una preview y, tras la fusión, producción. Las migraciones de `main` se aplican sin datos seed.

Las versiones siguen `MAJOR.MINOR.PATCH` y se publican mediante el workflow manual **Release** de GitHub. El proceso completo está en [VERSIONING.md](docs/deployment/VERSIONING.md).

## Mejoras futuras

- Enviar avisos sociales de retos y círculos solo cuando haya preferencias de usuario y presupuesto de correo definidos.
- Recorte y compresión de imágenes antes de subirlas, con eliminación automática de huérfanos.
- Selector de idioma completo y traducción de todos los textos.
- Notificaciones push y aplicación efectiva de horas silenciosas.
- Recuperación guiada de círculos eliminados mediante papelera con retención limitada.
- Proyecto Supabase separado para previews y staging.
- Observabilidad de errores, métricas de cron y alertas de cuota de Storage/SMTP.
- Dominio propio, DKIM/DMARC y revisión de entregabilidad de correo.
- Exportación y borrado completo de cuenta conforme a privacidad.
