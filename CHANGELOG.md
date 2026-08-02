# Historial de versiones

Este proyecto sigue [versionado semántico](https://semver.org/lang/es/): `MAJOR.MINOR.PATCH`.

## 0.2.0 — 2026-08-02

### Añadido

- Nombre visible y nombre de usuario separados durante el registro.
- Borrado de círculos exclusivo para su propietario y protegido por RLS.
- Selector de zonas horarias IANA en el perfil.
- Fotos privadas opcionales para perfiles y círculos, con límite de 5 MB.
- Releases manuales y trazables desde GitHub Actions.

### Cambiado

- Brevo envía únicamente confirmaciones de registro y recuperaciones de contraseña.
- Plantillas de esos dos correos adaptadas a la identidad visual de Pique.
- Eliminadas referencias personales fijas de la interfaz pública.

## 0.1.0 — 2026-08-02

- MVP inicial de Pique: auth, perfiles, círculos, invitaciones, retos y aceptación.
- Calendario, check-ins, evidencia privada y revisión entre participantes.
- Ledger idempotente, ranking, rachas, feed, notificaciones y consecuencias.
- PWA mobile-first, modo oscuro automático, cola offline limitada y accesibilidad AA.
- Migraciones, RLS, seed, tests, CI y documentación Vercel + Supabase.
