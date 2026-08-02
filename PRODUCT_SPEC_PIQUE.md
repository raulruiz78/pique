# PIQUE — Product Specification

**Versión:** 1.0  
**Fecha:** 2 de agosto de 2026  
**Estado:** Especificación lista para implementación del MVP  
**Producto:** PWA móvil-first de retos sociales para parejas, amigos y pequeños grupos

---

## 1. Resumen ejecutivo

Pique es una aplicación social para convertir objetivos cotidianos en retos compartidos. Los usuarios compiten o cooperan con su pareja, amigos, familia o equipo mediante calendarios, check-ins, evidencias, validación entre participantes, puntos, rankings, rachas y castigos o recompensas acordados.

El producto no mueve dinero ni permite retirar puntos. Las “apuestas” son compromisos simbólicos o externos —por ejemplo, invitar a cenar o elegir el próximo plan— para evitar complejidad legal, fiscal y antifraude.

La primera versión será una PWA privada por defecto, optimizada para móvil y construida como monolito modular con Next.js, TypeScript, PostgreSQL y Supabase. La propuesta de valor no es solo el calendario, sino el ciclo completo:

> Compromiso → acción → evidencia → validación social → puntos y ranking → recompensa o castigo → nuevo reto.

## 2. Problema y oportunidad

Las aplicaciones de hábitos suelen ser individuales y pierden interés rápidamente. Los grupos de amigos y parejas ya crean apuestas y objetivos en WhatsApp, notas o conversaciones, pero carecen de:

- Reglas acordadas y visibles.
- Un calendario común.
- Pruebas y validación.
- Puntuación transparente.
- Consecuencias sociales divertidas.
- Historial, rachas y rankings.

Pique reúne esas dinámicas en una experiencia juvenil, rápida y cercana, sin adoptar una estética infantil ni una gamificación agresiva.

## 3. Objetivos de producto

### Objetivo principal

Conseguir que un usuario participe activamente en un reto con otra persona y complete varios check-ins validados durante su primera semana.

### Objetivos secundarios

- Hacer que crear y aceptar un reto requiera menos de tres minutos.
- Dar visibilidad inmediata a lo que toca hacer hoy y quién va ganando.
- Reducir discusiones mediante reglas aceptadas, evidencias y auditoría.
- Crear un bucle de retención basado en recordatorios, rachas y nuevos retos.
- Mantener el dominio desacoplado para facilitar una futura aplicación móvil.

### No objetivos del MVP

- Custodiar, cobrar o transferir dinero.
- Retos públicos o marketplace.
- Chat en tiempo real.
- Integraciones con wearables o plataformas deportivas.
- Moderación avanzada mediante IA.
- Aplicaciones nativas independientes.
- Sistema complejo de niveles, monedas o compras.

## 4. Usuarios y casos de uso

### Segmentos iniciales

- Parejas que compiten con hábitos, tareas o planes.
- Grupos de amigos con retos de deporte, ocio o constancia.
- Familias con objetivos compartidos.
- Pequeños equipos que buscan motivación informal.

### Jobs to be done

- “Quiero retar a alguien con reglas claras y una consecuencia divertida.”
- “Quiero saber qué tengo que hacer hoy y no perder mi racha.”
- “Quiero demostrar que cumplí y que el grupo lo valide.”
- “Quiero ver quién va ganando sin hacer cuentas manuales.”
- “Quiero cerrar el reto con un resultado y compartirlo.”

### Restricción inicial

El lanzamiento se orientará a mayores de 18 años para simplificar privacidad, consentimiento y moderación.

## 5. Principios de producto

1. **Privado por defecto.** Círculos, retos y evidencias solo son visibles para personas autorizadas.
2. **Reglas aceptadas.** Ninguna regla relevante cambia unilateralmente una vez iniciado el reto.
3. **Puntuación explicable.** Cada punto debe tener una causa auditable.
4. **Acción rápida.** Un check-in habitual debe poder completarse en pocos segundos.
5. **Competición sana.** Sin compra de puntos, premios aleatorios ni mecánicas adictivas agresivas.
6. **Seguridad social.** Los castigos peligrosos, ilegales, humillantes o no consentidos están prohibidos.
7. **Móvil primero.** La experiencia primaria es vertical, táctil e instalable.

## 6. Conceptos de dominio

| Concepto | Definición |
|---|---|
| Usuario | Persona registrada con perfil, zona horaria y preferencias. |
| Círculo | Espacio privado de pareja, amigos, familia o equipo. |
| Reto | Competición o compromiso con reglas y duración determinadas. |
| Objetivo | Acción medible que debe completar un participante. |
| Ocurrencia | Ejecución concreta de un objetivo en una fecha o ventana temporal. |
| Check-in | Registro de que el usuario ha realizado una ocurrencia. |
| Evidencia | Foto, texto, valor, duración o enlace asociado al check-in. |
| Validación | Decisión automática o de participantes sobre un check-in. |
| Puntos | Unidad interna sin valor monetario utilizada para ranking y progresión. |
| Racha | Número consecutivo de periodos completados. |
| Castigo | Consecuencia acordada por incumplimiento o derrota. |
| Recompensa | Beneficio acordado al alcanzar el resultado. |
| Temporada | Periodo competitivo, como semana, mes o reto específico. |

## 7. Tipos de retos

- **Frecuencia:** realizar una actividad N veces por periodo.
- **Diario:** completar una acción cada día.
- **Acumulativo:** alcanzar una cifra antes de una fecha.
- **Racha:** mantener una acción sin interrupciones.
- **Resultado:** alcanzar un valor medible.
- **Uno contra uno:** dos usuarios compiten directamente.
- **Grupal:** cada participante compite individualmente.
- **Por equipos:** se agregan puntuaciones de varios miembros.
- **Cooperativo:** todos contribuyen a una meta común.

El MVP implementará frecuencia, diario, acumulativo y uno contra uno o grupal. Equipos y cooperativo quedan preparados en el modelo, pero no requieren interfaz completa.

## 8. Reglas y puntuación

### Fórmula base

```text
puntos = puntos base
        + bonus de racha
        + bonus de dificultad
        + bonus de finalización
        - penalizaciones
```

Ejemplo:

```text
Completar entrenamiento       +10
Racha de 5 días                +5
Completar objetivo semanal    +20
Registrar fuera de plazo       -3
Evidencia rechazada           -10
```

En el MVP, la puntuación, fechas, reglas, evidencia y castigo se aceptan por todos los participantes. Una vez publicado el reto, cualquier modificación material requiere una nueva versión y aprobación. El cliente nunca puede asignar puntos directamente.

### Ledger de puntos

Los puntos se almacenan como movimientos inmutables en `score_transactions`, no solo como un contador. Cada movimiento tendrá una restricción única equivalente a:

```text
UNIQUE(user_id, source_type, source_id, reason)
```

Esto proporciona auditoría, idempotencia, recálculo y resolución de disputas.

## 9. Ciclo de vida del reto

```text
DRAFT → PENDING_ACCEPTANCE → SCHEDULED → ACTIVE → COMPLETED
```

Estados alternativos:

- `DRAFT → CANCELLED`
- `PENDING_ACCEPTANCE → REJECTED | EXPIRED`
- `ACTIVE → PAUSED | CANCELLED | DISPUTED`

Reglas:

- `DRAFT`: visible y editable por el creador.
- `PENDING_ACCEPTANCE`: espera aceptación de todos los participantes requeridos.
- `SCHEDULED`: aceptado, aún no iniciado.
- `ACTIVE`: admite check-ins dentro de sus ventanas.
- `COMPLETED`: resultado final calculado y cerrado.
- `DISPUTED`: existe un conflicto pendiente.

## 10. Flujos principales

### Crear reto

1. Seleccionar plantilla o reto libre.
2. Introducir título, descripción y reglas.
3. Elegir círculo o participantes.
4. Definir fechas, recurrencia, objetivo y puntos.
5. Definir evidencia y método de validación.
6. Añadir castigo o recompensa opcional.
7. Revisar resumen y enviar invitaciones.
8. Los participantes aceptan o rechazan.
9. Al aceptar todos, el reto queda programado o activo.

### Completar objetivo

1. El usuario abre “Hoy”.
2. Selecciona una ocurrencia pendiente.
3. Pulsa “Hecho”.
4. Añade la evidencia requerida.
5. El servidor registra el check-in con hora propia.
6. Se autovalida o queda pendiente de revisión.
7. Al aprobarse, el motor asigna puntos una sola vez.
8. Se actualizan ranking, racha, feed y notificaciones.

### Finalizar reto

1. Llega la fecha final.
2. Se cierran nuevos check-ins.
3. Se resuelven o marcan validaciones pendientes.
4. Se calcula la puntuación definitiva.
5. Se determina el ganador y las posiciones.
6. Se asigna el castigo o desbloquea la recompensa.
7. Se genera una tarjeta compartible.

## 11. Alcance funcional del MVP

### Must have

- Registro, inicio de sesión, cierre de sesión y recuperación.
- Perfil con alias, avatar, zona horaria y preferencias.
- Círculos privados con invitación mediante enlace o código.
- Creación, aceptación, rechazo, cancelación y detalle de retos.
- Objetivos con recurrencia y ocurrencias de calendario.
- Inicio con tareas de hoy, puntuación y actividad reciente.
- Calendario semanal y mensual básico.
- Check-ins con nota, valor y foto opcional u obligatoria.
- Autovalidación y validación por rival.
- Ledger de puntos, ranking por reto y círculo.
- Rachas básicas.
- Castigos y recompensas no monetarios.
- Notificaciones in-app; push preparado y activable.
- Feed básico de actividad del círculo.
- Configuración de privacidad y notificaciones.
- Semilla de datos demo y modo local documentado.

### Should have

- Plantillas de retos.
- Reacciones simples.
- Resumen semanal.
- Tarjeta final compartible.
- Check-in offline en cola local.

### Fuera del MVP

- Ranking global público.
- Comentarios y chat.
- Retos públicos, ligas, temporadas y creadores.
- Suscripciones y cobros.
- Apple Health, Health Connect, Strava o wearables.

## 12. Experiencia de usuario

### Navegación móvil

```text
[Inicio] [Calendario] [+] [Ranking] [Perfil]
```

### Pantallas esenciales

1. **Onboarding y autenticación**
   - Propuesta de valor breve.
   - Email/password y proveedor social si está configurado.
   - Creación de alias y avatar.

2. **Inicio**
   - Saludo y avatar.
   - Puntos y racha.
   - Objetivos de hoy.
   - Ranking rápido.
   - Actividad reciente.
   - Avisos de vencimiento o castigo en riesgo.

3. **Crear reto**
   - Flujo en pasos con progreso.
   - Plantilla, reglas, participantes, calendario, puntos, evidencia y consecuencia.
   - Resumen final antes de publicar.

4. **Detalle de reto**
   - Progreso, ranking, participantes, reglas, calendario y feed relacionado.
   - Acciones condicionadas por estado y permisos.

5. **Check-in**
   - Acción principal clara.
   - Foto, nota o valor según configuración.
   - Estado de subida y validación.

6. **Calendario**
   - Vista semanal predeterminada y vista mensual secundaria.
   - Estado, puntos y reto identificables por evento.

7. **Ranking**
   - Filtros por semana, mes, reto, círculo e histórico.

8. **Perfil y círculo**
   - Estadísticas, historial, miembros, invitaciones y ajustes.

### Estados de interfaz obligatorios

Cada pantalla debe contemplar: carga, vacío, error recuperable, sin conexión, permisos insuficientes y éxito. Las acciones destructivas requieren confirmación y feedback claro.

## 13. Diseño visual

Personalidad juvenil, competitiva y cercana, sin apariencia infantil.

- Tarjetas grandes, bordes redondeados y jerarquía tipográfica marcada.
- Color principal energético: morado eléctrico, con acentos lima y coral.
- Fondo neutro adaptable a tema claro y oscuro.
- Verde para completado, ámbar para pendiente, rojo para riesgo y dorado para primer puesto.
- Avatares destacados, emojis moderados e ilustraciones simples.
- Microanimaciones respetando `prefers-reduced-motion`.
- Confeti reservado para hitos relevantes.
- Contraste WCAG AA, foco visible y áreas táctiles mínimas de 44 px.

La interfaz debe sentirse propia; no debe parecer una colección genérica de componentes sin dirección visual.

## 14. Arquitectura técnica

### Decisión

PWA móvil-first y monolito modular. No se usarán microservicios en el MVP.

### Stack

- Next.js con App Router, React y TypeScript estricto.
- Tailwind CSS y componentes accesibles basados en Radix/shadcn.
- Zod y React Hook Form.
- PostgreSQL, Supabase Auth, Storage y Realtime.
- Route Handlers o Server Actions con una capa explícita de servicios de dominio.
- Web Push/FCM como integración opcional y correo transaccional desacoplado.
- Sentry y PostHog detrás de adaptadores y variables de entorno.
- Vitest para unitarios e integración; Playwright para E2E.
- pnpm y estructura de workspace preparada para reutilización móvil.

### Capas

```text
Presentation → Application → Domain → Infrastructure
```

- **Presentation:** páginas, componentes, formularios y estado UI.
- **Application:** casos de uso y orquestación.
- **Domain:** entidades, invariantes, puntuación y transiciones.
- **Infrastructure:** Supabase, PostgreSQL, Storage, push, correo, analítica y logs.

### Estructura propuesta

```text
pique/
├── apps/web/
│   ├── app/
│   ├── components/
│   ├── features/
│   └── public/
├── packages/
│   ├── domain/
│   ├── database/
│   ├── validation/
│   ├── ui/
│   └── config/
├── supabase/
│   ├── migrations/
│   ├── functions/
│   └── seed.sql
├── tests/
│   ├── integration/
│   └── e2e/
└── docs/
    ├── architecture/
    ├── product/
    └── deployment/
```

### PWA y futuro móvil

La PWA incluirá manifest, iconos, pantalla instalable, service worker, cache del shell y estrategia offline limitada. La lógica de dominio no dependerá de componentes React, de modo que en el futuro pueda añadirse `apps/mobile` y reutilizar tipos, validaciones, cliente API y reglas.

## 15. Modelo de datos

### Entidades principales

```text
Profile ──< CircleMember >── Circle ──< Challenge
   │                                  ├──< ChallengeParticipant
   │                                  ├──< Goal ──< GoalOccurrence ──< CheckIn
   │                                  │                              ├── Evidence
   │                                  │                              └── Validation
   │                                  ├── Reward / Penalty
   │                                  └──< ScoreTransaction
   ├──< Friendship
   ├──< Device
   └──< Notification
```

### Tablas mínimas

- `profiles`: identidad pública interna, avatar, locale, timezone y totales.
- `friendships`: solicitudes, aceptación, rechazo y bloqueo.
- `circles` y `circle_members`: espacios, roles y membresía.
- `challenges`: reglas, tipo, estado, fechas, visibilidad, configuración y versión.
- `challenge_participants`: participante, equipo opcional, aceptación, score y posición.
- `goals`: métrica, objetivo, unidad, recurrencia, puntos y evidencia.
- `goal_occurrences`: ejecución esperada por participante y fecha.
- `check_ins`: valor, nota, estado y timestamps.
- `evidence`: tipo, ruta privada, hash y metadatos seguros.
- `validations`: revisor, decisión y razón.
- `score_transactions`: movimientos auditables e idempotentes.
- `penalties` y `rewards`: definición, asignación y cumplimiento.
- `notifications` y `devices`: bandeja in-app y suscripciones push.
- `activities` y `reactions`: feed social básico.
- `outbox_events`: eventos pendientes de procesamiento.
- `idempotency_keys`: protección de comandos repetidos.
- `audit_log`: cambios sensibles sin almacenar secretos ni contenido privado.

### Recurrencias

Se usará una representación compatible con RRULE, por ejemplo:

```text
FREQ=WEEKLY;BYDAY=MO,WE,FR
```

Se generarán ocurrencias para un horizonte limitado —inicialmente 30 días— mediante un job idempotente.

### Índices esenciales

- Participantes por usuario y estado.
- Ocurrencias por participante y fecha.
- Check-ins por ocurrencia.
- Movimientos por reto y usuario.
- Notificaciones no leídas por usuario.
- Actividad por círculo y fecha descendente.

## 16. API de alto nivel

Prefijo lógico: `/api/v1`.

```text
GET/PATCH  /users/me
GET         /users/{username}

GET/POST    /friends | /friend-requests
POST        /friend-requests/{id}/accept|decline

GET/POST    /circles
GET/PATCH   /circles/{circleId}
POST        /circles/{circleId}/invites
POST        /circle-invites/{code}/accept

GET/POST    /challenges
GET/PATCH   /challenges/{challengeId}
POST        /challenges/{id}/publish|accept|reject|cancel

POST        /occurrences/{id}/check-ins
GET         /check-ins/{id}
POST        /check-ins/{id}/approve|reject|dispute

GET         /today
GET         /calendar?from=&to=
GET         /leaderboards/challenges/{id}
GET         /leaderboards/circles/{id}
GET         /feed
GET/PATCH   /notifications
```

Los endpoints mutables aceptarán claves de idempotencia cuando puedan repetirse. Todos los payloads se validan en servidor. Los errores siguen una forma consistente con código, mensaje seguro, detalles de validación y `requestId`.

## 17. Autorización y privacidad

Supabase Auth identifica al usuario; PostgreSQL Row Level Security y la capa de dominio imponen el acceso.

Un usuario solo puede:

- Ver círculos a los que pertenece.
- Ver retos en los que participa.
- Crear y modificar sus check-ins dentro de plazo.
- Ver evidencias autorizadas.
- Validar cuando las reglas lo permitan, nunca su propia evidencia si es peer review.
- Modificar retos propios mientras sean borrador.
- Consultar rankings de sus círculos y retos.

Las operaciones sensibles —puntuación, ganadores, penalizaciones, finalización y cambios de reglas— se ejecutan exclusivamente en servidor con credenciales adecuadas. Las evidencias se guardan en buckets privados y se entregan con URLs firmadas temporales.

Visibilidades iniciales:

- Perfil: privado o solo amigos.
- Reto: privado o círculo.
- Evidencia: participantes/validadores o solo propietario cuando proceda.

## 18. Validación, concurrencia e idempotencia

### Métodos del MVP

- Autovalidación.
- Validación por rival.
- Validación por mayoría simple preparada en dominio.

Estados: `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `DISPUTED`, `EXPIRED`.

Controles:

- Hora del servidor y ventana de check-in.
- Una validación por revisor.
- Transacciones de base de datos.
- Control optimista mediante `version`.
- Claves de idempotencia.
- Hash de archivos y detección de duplicados.
- Inmutabilidad tras aprobación salvo flujo explícito de disputa.
- Transiciones de estado controladas y probadas.

## 19. Eventos y trabajos programados

Eventos de dominio: `ChallengeCreated`, `ChallengeAccepted`, `ChallengeStarted`, `CheckInSubmitted`, `CheckInApproved`, `CheckInRejected`, `ScoreChanged`, `StreakIncreased`, `StreakBroken`, `ChallengeCompleted`, `PenaltyAssigned` y `RewardUnlocked`.

Se usará patrón outbox: el cambio de dominio y el evento se guardan en la misma transacción; un worker procesa después puntuación, feed y notificaciones.

Jobs idempotentes:

- `GenerateGoalOccurrences`
- `SendUpcomingReminders`
- `MarkExpiredOccurrences`
- `BreakExpiredStreaks`
- `CompleteEndedChallenges`
- `ResolveLeaderboards`
- `ExpireInvitations`
- `CleanTemporaryUploads`
- `SendWeeklySummary`

La implementación debe ofrecer endpoints de cron protegidos o funciones programadas compatibles con el proveedor de despliegue elegido.

## 20. Evidencias y almacenamiento

Flujo recomendado:

1. El cliente solicita autorización de subida.
2. El servidor verifica participación y tipo de evidencia.
3. El cliente sube directamente al storage privado.
4. El servidor confirma tamaño, tipo, ruta y hash.
5. Se crea `evidence` y se asocia al check-in.

Restricciones iniciales:

- Solo imágenes JPEG, PNG y WebP; HEIC debe convertirse en cliente si se soporta.
- Máximo configurable de 10 MB.
- Compresión previa en cliente.
- Sin buckets públicos.
- Eliminación de metadatos sensibles cuando sea posible.
- URLs firmadas de corta duración.

## 21. Notificaciones

Canales: bandeja in-app obligatoria, push opcional y correo transaccional desacoplado.

Eventos: invitación, aceptación, objetivo próximo, vencimiento, adelantamiento, validación, rechazo, racha en riesgo, fin de reto, castigo asignado y reacción.

Cada usuario puede configurar canales, categorías y horas silenciosas. Los eventos se agrupan para evitar spam. Los payloads push no incluirán información privada innecesaria.

## 22. Offline y tiempo real

- Cachear el shell y calendario reciente.
- Permitir preparar un check-in sin conexión.
- Estados locales: `LOCAL_PENDING → SYNCING → SERVER_SUBMITTED`.
- No asignar puntos hasta confirmación del servidor.
- Usar tiempo real solo para ranking, validación, actividad y progreso colectivo.
- El calendario y pantallas históricas usarán API y caché normal.

## 23. Seguridad y moderación

Controles mínimos:

- HTTPS, cookies seguras y `HttpOnly` cuando correspondan.
- Validación server-side y límites de tamaño.
- RLS, rate limiting y protección CSRF según el mecanismo de sesión.
- Cifrado en tránsito y reposo.
- Secretos solo en variables de entorno, con `.env.example` sin valores reales.
- Backups y migraciones reversibles cuando sea viable.
- Logs sin tokens, contraseñas, URLs firmadas completas ni evidencias.
- Cabeceras de seguridad y política CSP razonable.
- Bloqueo, denuncia y salida de círculos.

Castigos prohibidos: daño físico, ilegalidad, contenido sexual no consentido, humillación pública, consumo de sustancias, acoso, acceso a cuentas, exposición privada o cantidades económicas elevadas.

Plantillas seguras: invitar a cenar, preparar desayuno, hacer una tarea doméstica, elegir película, organizar un plan o perder el derecho a elegir restaurante.

## 24. Observabilidad y analítica

Logs estructurados con `requestId`, `userId` pseudonimizado cuando sea posible, entidad, acción, duración y estado.

Métricas técnicas:

- Latencia, 4xx/5xx y consultas lentas.
- Jobs, notificaciones y subidas fallidas.
- Conexiones realtime.
- Tasa de rechazo y disputas.

Métricas de producto:

- North Star: check-ins validados por usuario activo por semana.
- Activación en 24 horas.
- Retención D7 y D30.
- Retos aceptados frente a enviados.
- Check-ins por usuario activo.
- Retos terminados y repetidos.
- Participantes medios y rachas.

Analítica y monitorización deben estar encapsuladas y ser desactivables en local.

## 25. Rendimiento y accesibilidad

Objetivos iniciales:

```text
LCP móvil              < 2,5 s
API p95                < 500 ms
Check-in percibido     < 1 s
Disponibilidad         99,5 %
```

Técnicas: Server Components para carga inicial, lazy loading del feed, imágenes optimizadas, UI optimista controlada, paginación por cursor, índices, consultas específicas y CDN para assets.

Accesibilidad: WCAG 2.1 AA, navegación por teclado, semántica correcta, etiquetas, contraste, lectores de pantalla, foco visible y reducción de movimiento.

## 26. Testing y calidad

### Unitarios

- Puntuación e idempotencia.
- Rachas y recurrencias.
- Ganadores y desempates.
- Transiciones de estado.
- Penalizaciones y permisos de dominio.

### Integración

- Crear y aceptar reto.
- Generar ocurrencias.
- Check-in, validación y puntos.
- RLS y acceso a storage.
- Procesamiento de outbox.

### End-to-end

Escenario crítico:

> Usuario A crea un reto → Usuario B lo acepta → A completa una ocurrencia → B valida → el ranking se actualiza → el reto finaliza → se asigna el castigo.

### Seguridad

- Un usuario no puede leer círculos ajenos.
- Nadie puede asignarse puntos desde el cliente.
- Un no participante no puede ver evidencias.
- Un usuario bloqueado no puede invitar.
- Una URL firmada expirada deja de funcionar.

Los comandos `lint`, `typecheck`, `test`, `test:e2e` y `build` deben estar documentados y ejecutarse en CI.

## 27. Despliegue objetivo

Configuración recomendada:

- Aplicación y API: Vercel.
- PostgreSQL, Auth, Storage y Realtime: Supabase.
- Push: Firebase Cloud Messaging o Web Push estándar, opcional en el primer despliegue.
- Email: Resend, Postmark o SES mediante adaptador.
- Errores: Sentry.
- Analítica: PostHog.

El repositorio incluirá:

- `README.md` con inicio rápido.
- `.env.example` comentado.
- Migraciones SQL y seed reproducible.
- `docs/deployment/DEPLOYMENT.md` con despliegue local, preview y producción.
- Creación de proyectos, variables, OAuth, dominios, cron, buckets, políticas RLS y callbacks.
- Verificación posterior al despliegue y rollback.
- Workflow CI para lint, tipos, tests y build.

Ningún paso esencial puede quedar implícito.

## 28. Criterios de aceptación del MVP

El MVP se considera entregable cuando:

1. Dos usuarios reales pueden registrarse y configurar su perfil.
2. Uno crea un círculo e invita al otro mediante enlace o código.
3. Puede crear un reto recurrente con puntos, evidencia y castigo.
4. El segundo usuario acepta y el reto cambia correctamente de estado.
5. Las ocurrencias aparecen en “Hoy” y calendario según zona horaria.
6. Un participante puede enviar un check-in con foto privada.
7. El revisor puede aprobar o rechazar según las reglas.
8. Los puntos se aplican exactamente una vez y el ranking se actualiza.
9. Los usuarios ajenos no pueden acceder al círculo, reto ni evidencia.
10. Al finalizar, se calcula ganador, posiciones y consecuencia.
11. La app es instalable como PWA y funciona correctamente en móvil.
12. Existe una demo reproducible con datos semilla.
13. Lint, tipos, unitarios, integración, E2E crítico y build pasan.
14. Un desarrollador puede desplegar siguiendo únicamente la documentación.

## 29. Roadmap

### Fase 0 — Discovery

Entrevistas, prototipo navegable, prueba de creación de retos, tono visual y plantillas.

### Fase 1 — MVP

Auth, perfil, círculos, retos, calendario, check-ins, fotos, puntos, ranking, rachas, castigos, notificaciones y feed básico.

### Fase 2 — Retención

Insignias, resumen semanal, reacciones, comentarios, plantillas avanzadas, compartir resultados, modo pareja y mejores recurrencias.

### Fase 3 — Crecimiento

Retos públicos, referral, perfiles públicos, ligas, temporadas y equipos.

### Fase 4 — Plataforma

Aplicación móvil, Apple Health, Health Connect, Strava, wearables, suscripciones, recomendaciones e API de integraciones.

## 30. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| El usuario crea un reto y lo olvida | Onboarding de siete días, recordatorios, plantillas y resumen. |
| No encuentra participantes | Invitación por WhatsApp, código y enlace directo; demo guiada. |
| Discusiones por validación | Reglas aceptadas, auditoría, evidencia y disputa. |
| Gamificación excesiva | Sin compra de puntos, azar ni notificaciones agresivas. |
| Evidencias privadas | Storage privado, permisos, URLs temporales y explicación clara. |
| Castigos abusivos | Plantillas, prohibiciones, denuncia, bloqueo y moderación. |
| Complejidad técnica temprana | Monolito modular, adaptadores y alcance cerrado. |

## 31. Decisiones arquitectónicas

- **ADR-001 — PWA antes que app nativa:** valida el producto con una base de código.
- **ADR-002 — Monolito modular:** el volumen inicial no justifica microservicios.
- **ADR-003 — PostgreSQL:** el dominio es relacional y requiere transacciones.
- **ADR-004 — Ledger de puntos:** auditoría, idempotencia y recálculo.
- **ADR-005 — Sin apuestas monetarias:** solo compromisos simbólicos o externos.
- **ADR-006 — Privado por defecto:** acceso explícito a retos, círculos y evidencias.
- **ADR-007 — Jobs y outbox idempotentes:** consistencia ante reintentos y fallos parciales.

## 32. Ejemplo funcional

```json
{
  "title": "Agosto sin vaguear",
  "type": "FREQUENCY",
  "participants": ["user_raul", "user_carmen"],
  "schedule": {
    "startDate": "2026-08-01",
    "endDate": "2026-08-31",
    "timezone": "Europe/Madrid",
    "recurrence": "FREQ=WEEKLY;BYDAY=MO,WE,FR"
  },
  "goal": {
    "name": "Entrenar",
    "target": 1,
    "unit": "session",
    "points": 10
  },
  "validation": {
    "type": "PEER_REVIEW",
    "evidenceRequired": true,
    "evidenceType": "PHOTO"
  },
  "bonuses": {
    "weeklyCompletion": 20,
    "streakEvery": 3,
    "streakPoints": 5
  },
  "penalty": {
    "description": "El perdedor invita a cenar"
  }
}
```

---

**Fuente de verdad:** ante dudas durante la implementación, se priorizan privacidad, reglas aceptadas, puntuación auditable, experiencia móvil y el alcance del MVP definido en este documento.
