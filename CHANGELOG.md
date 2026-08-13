# Historial de versiones

Este proyecto sigue [versionado semántico](https://semver.org/lang/es/): `MAJOR.MINOR.PATCH`.

## 0.4.0 — 2026-08-13

### Añadido

- Safe Areas completas (notch y Dynamic Island): variables CSS compartidas para el navegador inferior y el contenedor de la app.
- Splash screen para iOS generada a partir del icono de la app (`pnpm generate:splash`).
- Instalación guiada de la PWA: banner con prompt nativo en Chrome/Android e instrucciones manuales en iOS Safari.
- Detección de PWA instalada mediante `display-mode: standalone`.
- Mejor comportamiento del teclado móvil (`interactiveWidget: resizes-content`, inputs sin auto-zoom en iOS).

### Cambiado

- El color de fondo y tema del manifest ahora coincide con la identidad visual oscura real de la app.
- La navegación inferior y el contenedor principal usan variables de área segura en vez de valores fijos.

## 0.3.0 — 2026-08-03

### Añadido

- Rediseño integral basado en Google Stitch, con identidad visual oscura, fondos animados y navegación mobile-first.
- Categorías de retos con iconos reutilizados en Inicio, Calendario, círculos y detalle.
- Niveles, rangos, progreso y ocho logros desbloqueables desde el perfil.
- Círculos públicos con exploración y solicitudes de acceso aprobadas exclusivamente por su creador.
- Calendario mensual interactivo con detalle de retos por día.
- Página independiente de validaciones con evidencias navegables horizontalmente.
- Invitaciones a círculos mediante la hoja nativa de compartir o enlace copiado.

### Cambiado

- La lista de círculos cuenta únicamente retos realmente activos.
- La agenda de próximos 30 días excluye ocurrencias anteriores a hoy.
- Inicio muestra únicamente el resumen diario, objetivos y validaciones pendientes.
- Check-in, evidencias, podios, notificaciones, perfil y creación de retos adoptan la jerarquía visual de Stitch.

### Seguridad

- Los círculos siguen siendo privados por defecto.
- Publicar un círculo no permite entradas automáticas: cada solicitud requiere decisión del propietario.
- Evidencias y fotografías mantienen storage privado y autorización existente.

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
