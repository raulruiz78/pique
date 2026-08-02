# Desarrollo local

## Requisitos

- Node.js 24 LTS (`.nvmrc`).
- pnpm 11.18 o posterior compatible.
- Docker Desktop activo.
- Git.

## Preparación

```bash
nvm install 24
nvm use 24
npm install --global pnpm@11.18.0
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm db:start
pnpm db:reset
cp -n .env.example apps/web/.env.local
```

`pnpm exec supabase status` muestra URL, clave pública y secret local. Completa `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `SUPABASE_SECRET_KEY`. Define también `CRON_SECRET` con al menos 24 caracteres.

```bash
pnpm dev
```

Web: <http://localhost:3000>. Studio: <http://localhost:54323>. Inbucket captura el correo local.

## Datos demo

`pnpm db:reset` vuelve a aplicar migraciones y `supabase/seed.sql`. La operación es destructiva para la base local. Usuarios:

- `raul@pique.local` / `PiqueDemo2026!`
- `carmen@pique.local` / `PiqueDemo2026!`

## Comprobación

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm exec supabase test db
pnpm build
pnpm test:e2e
```

Para pruebas de integración exporta las variables locales. Ejemplo Bash:

```bash
eval "$(pnpm exec supabase status -o env)"
export NEXT_PUBLIC_SUPABASE_URL="$API_URL"
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$ANON_KEY"
export SUPABASE_SECRET_KEY="$SERVICE_ROLE_KEY"
pnpm test
```

## Cron local

```bash
curl -X POST http://localhost:3000/api/v1/cron/maintenance \
  -H "Authorization: Bearer $CRON_SECRET"
```

No se registran tokens, URLs firmadas ni contenido de evidencias.
