# Historial de versiones

Este proyecto sigue [versionado semántico](https://semver.org/lang/es/): `MAJOR.MINOR.PATCH`.

## 0.9.0 — 2026-08-27

### Añadido

- Coins y comodines por círculo: cada punto que ganas en un reto suma 1 coin a un saldo aparte de ese círculo (nunca resta de tu puntuación de ranking). Con 1000 coins se compra un comodín; un comodín salta un check-in con auto-aprobado, sin foto ni puntos — solo salva la racha. Comprables desde la vista del círculo; se usan desde la propia hoja de check-in si tienes alguno disponible.
- El feed de actividad y el historial de check-ins (`/mis-pruebas`) marcan de forma visible cuándo un check-in se resolvió con un comodín, en vez de mostrarlo como una validación normal.
- Icono propio de la moneda de Pique (una "P" sobre una moneda lima) para todo lo relacionado con coins/comodines.

## 0.8.0 — 2026-08-26

### Añadido

- Pantalla de ajustes del círculo (`/circulos/[id]/ajustes`), solo para el creador, con la foto en modo "toca para ver opciones" en vez de las burbujas de cambiar/eliminar sobre el avatar.

### Corregido

- Las fotos de círculo se subían bien pero nunca se podían ver, ni para el propio dueño: la política de lectura de Storage comparaba `circle.avatar_path = name` esperando la ruta del archivo, pero al tener `circles` su propia columna `name`, Postgres resolvía la comparación contra el nombre del círculo en vez de contra la ruta — la condición nunca se cumplía. Mismo fallo corregido en las políticas de subida y borrado.

## 0.7.0 — 2026-08-26

### Añadido

- Crear círculo pasa de un cuadro de texto inline a una pantalla propia (`/circulos/crear`), con nombre, descripción y foto opcional con recorte.
- Foto de perfil: tocarla abre una hoja con "Cambiar foto"/"Eliminar foto" en vez de las dos burbujas siempre visibles sobre el avatar.
- "Foto como evidencia" en el asistente de creación solo aparece si "Que te vigile el rival" está activo.
- Fechas del asistente de creación: "Empieza" no admite días anteriores a hoy; "Termina" no admite antes de "Empieza".

### Cambiado

- Tocar una notificación ahora la marca como leída y navega a su destino, en vez de no hacer nada; las notificaciones leídas desaparecen de `/notificaciones` (antes solo el botón "Marcar leídas" existía, y marcaba todas de golpe).
- Normalización CSS del `<input type="date">` para iOS, donde se renderizaba más grande que el resto de campos del mismo formulario.

### Corregido

- La notificación "👀 Toca validar" llevaba a `/hoy` en vez de a `/validaciones`, la página construida para revisar evidencias pendientes.
- El teclado móvil tapaba la nota del check-in al escribir (sin scroll automático hacia el campo enfocado dentro de la hoja inferior).

## 0.6.0 — 2026-08-26

### Añadido

- Multiplicador de racha opcional por reto: los puntos suben hasta x2 según `challenge_participants.streak_days`, normalizada por unidad de cadencia completa (día o semana) para que un reto de varias veces al día no llegue al tope más rápido que uno diario. Se activa al crear el reto y se muestra junto a él en `/hoy` y en la vista de círculo.
- Recordatorio de tarde (`notify_afternoon_reminder`): avisa si sigues sin cumplir un reto a media tarde, con tono distinto si tienes racha en juego.
- Auto-aprobado de check-ins sin validar en 24h (`auto_approve_stale_check_ins`), para que un validador lento o ausente no retenga la racha del otro participante.
- Puntos por check-in fijos a 5/10/20 (antes texto libre), para que el ranking y las medallas por puntos funcionen igual en todos los retos.
- Pestaña "Validar" en la navegación inferior (sustituye a "Perfil", que ahora se accede tocando tu foto); `/validaciones` muestra también tus propios check-ins pendientes de que te los validen.
- Selector de círculo y de validación (rival/autovalidación) en el asistente de creación, con tarjetas en vez de desplegables; la lista de participantes ya no aparece vacía antes de elegir círculo.

### Cambiado

- El cron de mantenimiento pasa de una ejecución diaria a las 02:15 UTC (fuera de cualquier ventana horaria útil) a las 13:00 UTC, y ahora también expira ocurrencias rechazadas y abandonadas sin reenviar.

### Corregido

- Los retos con autovalidación (`validation_type = 'SELF'`) no otorgaban puntos ni racha: el check-in se marcaba `APPROVED` al instante, pero solo la aprobación por rival disparaba la puntuación.
- Un check-in rechazado y nunca reenviado no rompía la racha del participante.

## 0.5.0 — 2026-08-14

### Añadido

- Notificaciones push mediante Web Push estándar (VAPID) sobre la tabla `devices` existente; sin credenciales, el adaptador cae a no-op.
- Nuevos tipos de notificación de retos: reto aceptado, reto finalizado, racha en riesgo, objetivo pendiente y rival adelantado.
- Preferencias de notificación (in-app, push, correo, horas silenciosas) gestionables desde el perfil, con suscripción real al Service Worker.
- Sistema de amistad: solicitudes por alias, aceptación o rechazo, notificaciones asociadas y página dedicada `/amigos`.

### Cambiado

- El job de mantenimiento periódico calcula los eventos de notificación derivados y reparte el push pendiente además de sus tareas habituales.
- Los eventos de notificaciones de retos y amistad se disparan en línea desde los endpoints correspondientes para reducir la latencia frente al ciclo del cron.

### Seguridad

- Solo quien recibe una solicitud de amistad puede aceptarla o rechazarla; quien la envía no puede autoaprobarla.
- Nueva política de lectura de perfiles limitada a relaciones de amistad activas o pendientes, sin exponer perfiles fuera de círculos ni amistades compartidas.

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
