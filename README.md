# Pique

PWA privada y mobile-first para convertir objetivos cotidianos en retos compartidos. Incluye reglas aceptadas, calendario, evidencia fotográfica privada, validación social, ledger de puntos, ranking, rachas y consecuencias no monetarias.

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
