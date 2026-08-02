# Decisiones

- **ADR-001 — PWA antes que nativa.** Un único producto instalable valida el uso y conserva acceso a cámara/push.
- **ADR-002 — Monolito modular.** Menor coste operacional; los límites internos permiten extraer solo si el volumen lo exige.
- **ADR-003 — PostgreSQL y Supabase.** El dominio es relacional, privado y transaccional.
- **ADR-004 — Ledger inmutable.** Auditoría e idempotencia ganan frente a un contador editable.
- **ADR-005 — Sin dinero.** Consecuencias simbólicas; reduce daño y complejidad legal.
- **ADR-006 — Privado por defecto.** RLS y storage privado; compartir requiere membresía explícita.
- **ADR-007 — Outbox.** El hecho y el evento se guardan juntos; notificaciones pueden reintentarse.
- **ADR-008 — Next.js 16 LTS activo.** App Router, Proxy para refresh SSR y Turbopack estable.
- **ADR-009 — Supabase SSR.** Cookies PKCE mediante `@supabase/ssr`; no se usa el paquete auth-helpers obsoleto.
