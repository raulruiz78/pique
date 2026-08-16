# Sistema de motion — "Pique Motion & Delight"

**Estado: especificación lista para implementar.** A diferencia de
`comments.md`/`result-sharing.md`/`quick-challenges.md`, este documento
no tiene decisiones de producto pendientes — es una especificación
técnica de interacción, pensada para implementarse directamente,
dividida en fases independientes (cada una es un PR).

Nace de la fase [0.8.x](../../Roadmap.md) (App-like UX & Performance),
ya implementada (0.8.1–0.8.8): esa fase resolvió la velocidad real
(auth cacheada, queries divididas, optimistic UI, cache de navegación).
Esta fase resuelve la velocidad **percibida**: que cada acción del
usuario produzca una respuesta visual inmediata, contextual y breve.

## Filosofía (no negociable)

> La interfaz está quieta hasta que el usuario hace algo. Entonces
> responde.

Ya hubo un precedente del problema contrario en este proyecto:
`shell-ambient`, una animación continua de `background-position` en
todo el app shell, se retiró en 0.8.7 precisamente porque una animación
perpetua (no disparada por una acción) cuesta batería/CPU sin aportar
nada. Ese criterio se mantiene aquí:

**Prohibido en cualquier pieza de esta fase:**

- animaciones continuas/infinitas (fondos, parallax, partículas
  permanentes, sombras pulsantes);
- animar `background-position`, `filter`, `width`/`height`,
  `top`/`left` — solo `transform` y `opacity` (excepción puntual:
  barras de progreso, ver 0.8.9.3);
- animaciones >500ms para una acción normal (check-in, swipe, reacción);
- añadir una librería de animación/gestos sin haber comprobado antes
  que Pointer Events + CSS/Web Animations API nativos no bastan (mismo
  criterio que 0.8.7). Con alta probabilidad no hace falta ninguna: los
  gestos de swipe de este documento son arrastre en un solo eje, que
  Pointer Events resuelve bien sin dependencias.
- confeti/celebración grande fuera de los momentos listados como tal en
  0.8.9.3 — si se usa para todo, deja de significar algo.

## Motion tokens (0.8.9.1 — base de todo lo demás)

Añadir a `apps/web/app/globals.css`, junto a las variables de color ya
existentes en `:root`:

```css
--duration-fast: 120ms;
--duration-normal: 200ms;
--duration-slow: 400ms;
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* overshoot sutil */
--scale-pressed: 0.97;
```

Reutilizar en vez de reinventar: `.page-enter` (200ms), `.nav-item`,
`.reaction-chip` y `.button:active` ya existen y ya siguen este
criterio (`globals.css`) — deben migrar a los tokens nuevos, no
duplicarse.

**Utilidad transversal**: un hook `apps/web/hooks/use-reduced-motion.ts`
no es necesario — `prefers-reduced-motion` ya está cubierto
globalmente (`globals.css`, bloque `@media (prefers-reduced-motion:
reduce)`). Cualquier animación nueva basada en CSS lo hereda gratis;
cualquier animación nueva hecha con JS (p. ej. arrastre de swipe) debe
comprobar `window.matchMedia("(prefers-reduced-motion: reduce)")` y
saltar directamente al estado final sin interpolar.

---

## 0.8.9.2 — Swipe cards (retos y validaciones)

La pieza de mayor impacto y la de más riesgo técnico — hacerla primero
y sola en su propio PR.

**Componente nuevo**: `apps/web/components/swipe-card.tsx` — genérico,
sin conocimiento de "retos" ni "validaciones", recibe:

```ts
{
  onSwipeLeft: () => void;   // rechazar
  onSwipeRight: () => void;  // aceptar
  leftLabel: string;         // "Rechazar"
  rightLabel: string;        // "Aceptar"
  children: React.ReactNode;
  disabled?: boolean;
}
```

Implementación con Pointer Events (`onPointerDown/Move/Up`), sin
dependencias nuevas:

- arrastre horizontal → `transform: translateX(dx) rotate(dx / 20deg)`,
  clamp de rotación a ±12°;
- opacidad de un icono de acción (✕ a la izquierda, ✓ a la derecha)
  proporcional a `abs(dx) / umbral`;
- umbral de confirmación: 40% del ancho de la card o velocidad de
  soltar > 0.5px/ms;
- por debajo del umbral al soltar → vuelve a `translateX(0)` con
  `--ease-spring`, `--duration-normal`;
- por encima del umbral → completa la salida (`translateX(±120%)`,
  `--duration-fast`) y dispara el callback correspondiente; la
  siguiente card entra con `scale(0.96) → scale(1)`, `--duration-fast`;
- también debe funcionar con los botones "Rechazar"/"Aceptar" ya
  existentes (`challenge-actions.tsx`) — el swipe es un atajo, no
  sustituye al botón (accesibilidad, precisión en pantallas pequeñas).

**Aplicado:**

1. Deck de retos pendientes en `/circulos/[circleId]` — nuevo
   `apps/web/components/pending-challenge-card.tsx`, que envuelve la
   card en `SwipeCard` y comparte el estado optimista
   "Aceptando…/Rechazando…" (extraído a
   `apps/web/hooks/use-challenge-response.ts`, usado también por
   `challenge-actions.tsx`) entre el gesto y los botones. El swipe
   dispara la misma función que el botón, no una nueva.

**Deliberadamente sin aplicar:**

- `retos/[challengeId]` (detalle de un solo reto): `ChallengeActions`
  se mantiene solo con botones. Es una página de detalle de lectura
  larga, no un deck — un swipe horizontal ahí compite con el scroll
  vertical de la página sin aportar nada que el botón no dé ya.
- Validaciones (`apps/web/app/(app)/validaciones/page.tsx`): al
  implementarlo se descubrió un conflicto real no anticipado en la
  especificación original — `.validation-deck` ya es un carrusel de
  scroll-snap **horizontal** para navegar entre evidencias pendientes
  (`review-carousel`/`validation-deck` en `globals.css`). Un swipe
  horizontal para aprobar/rechazar competiría por el mismo eje que el
  swipe horizontal de navegación ya existente — no es un detalle de
  animación, es una decisión de qué gesto gana ese eje. Queda
  pendiente de decisión de producto: o se resuelve como swipe
  **vertical** (arriba = aprobar, abajo = rechazar) en la card actual,
  o se rediseña la navegación entre evidencias antes de añadir el
  gesto. No implementado hasta que se decida.
- Listas de amigos, notificaciones, feed de actividad — no son
  decisiones binarias aceptar/rechazar por card, un swipe ahí sería
  gratuito.

---

## 0.8.9.3 — Gamification motion

Estas son las piezas con más ROI de "sensación de recompensa" por
esfuerzo de implementación.

### Puntos flotantes — bloqueado, requiere una decisión previa

Al implementar 0.8.9.3 se descubrió que esta pieza, tal como estaba
descrita, asumía que el check-in del propio usuario otorga puntos al
instante. No es así: `review_check_in` (función `security definer`,
`supabase/migrations/202608140024_check_in_activity.sql`) es quien
otorga los puntos, y solo se ejecuta cuando **otro** participante
aprueba la evidencia — no cuando el usuario hace check-in. Además esa
función devuelve la fila de `check_ins` actualizada, no los puntos
otorgados; ni el cliente que hace check-in ni el que revisa
(`ReviewButtons`) tienen ese número hoy.

Mostrar un `+N` en cualquiera de los dos momentos sin ese dato sería
inventar una cifra. Antes de implementar puntos flotantes hace falta
una de estas dos cosas (decisión técnica, no de producto, pero sí un
cambio deliberado sobre una función crítica, no algo para colar en un
PR de motion):

1. Que `review_check_in` devuelva también los puntos otorgados
   (`goal.base_points`), o
2. Que el cliente que revisa consulte el punto base del goal por
   separado antes de llamar a la RPC.

Hasta entonces, `ReviewButtons` (PR 3) usa el mismo patrón optimista
"Validando…/Rechazando…" que `ChallengeActions`, con `.motion-pop` al
confirmar — sin número, honesto con lo que se sabe en ese momento.

### Racha (streak) — bloqueado por el mismo motivo

La racha tampoco aumenta al hacer check-in, sino al aprobarse (mismo
trigger que los puntos, mismo problema: el valor nuevo no llega al
cliente en el momento del gesto). Descartado hasta que exista una
fuente de datos real; no se simula.

### Barra de XP / nivel

Única excepción autorizada a "solo transform/opacity": el `width` de
una barra de progreso ya existente no es animable de forma barata con
`transform` sin reescribir su layout — transición de `width`
`--duration-slow` `--ease-out` es aceptable aquí porque ocurre una vez
por acción, no en bucle. Si se cruza un nivel: overlay breve
("¡Nuevo nivel!"), `scale(0.9→1) + opacity`, `--duration-slow`,
autodescarta a los ~1.5s sin requerir tap.

### Logros

Al desbloquear: la card de logro pasa de icono 🔒 a 🏆 con
`scale(1 → 1.15 → 1)` + un toast/notificación (ver 0.8.9.5), no un
overlay de pantalla completa — un logro no es tan raro como para
justificar interrumpir el flujo.

### Confeti (uso restringido)

Solo en: reto completado con éxito, subida de rango (no de nivel —
rango es el hito grande), logro raro (si en el futuro hay niveles de
rareza). Implementación CSS pura (`--duration-slow` a `1.2s` máximo,
partículas `position: absolute` con `transform`+`opacity`, sin canvas,
sin librería) — es un efecto de un solo disparo, no continuo, así que
no viola la prohibición de animaciones perpetuas.

### Cambio de rango (celebración completa)

La única animación "grande" autorizada de toda esta fase: overlay a
pantalla completa, ~1.5–2s, descartable con tap. Todo lo demás de este
documento es deliberadamente pequeño y rápido — este es el único
momento donde vale la pena romper esa regla porque es un hito real y
poco frecuente.

---

## 0.8.9.4 — Mobile interaction

### Bottom sheet para el modal de check-in

Quedó explícitamente fuera de 0.8.7 ("es un cambio visual de un
componente existente, no una decisión técnica pura") — aquí sí entra,
porque ya hay una decisión: convertir el modal de check-in (y
cualquier otro modal de confirmación simple que exista) en bottom
sheet.

Nuevo componente `apps/web/components/bottom-sheet.tsx`:

- entra desde abajo, `translateY(100% → 0)`, `--duration-normal`,
  `--ease-out`; backdrop `opacity 0→1` en paralelo;
- arrastrable verticalmente (Pointer Events, mismo patrón que
  `SwipeCard` pero en el eje Y); soltar por debajo del 30% de su altura
  o con velocidad suficiente → cierra;
- respeta `--safe-bottom` (ya definida desde 0.4.0) en su padding
  inferior;
- reemplaza el modal de check-in existente sin cambiar su contenido ni
  su lógica, solo el contenedor.

### Pull-to-refresh

Solo en rutas con contenido que cambia por acción de terceros sin que
el usuario haga nada él mismo (`/hoy`, `/circulos/[circleId]` — feed de
actividad). No en rutas de solo-mutación (`/perfil`). Implementación
nativa con Pointer Events sobre el contenedor de scroll, sin
dependencia: umbral de arrastre → icono de refresco rota
proporcionalmente al arrastre → al soltar por encima del umbral,
llama a `router.refresh()` y muestra un spinner breve.

### Rubber band

Aplicar el mismo principio de "resistencia al límite + rebote" a:
`SwipeCard` (ya lo tiene por diseño: por debajo del umbral, vuelve con
`--ease-spring`), `BottomSheet` (idem, verticalmente), carrusel de
evidencias si existe scroll horizontal nativo (usar
`overscroll-behavior-x` + un `translateX` de resistencia, no CSS puro
de scroll-snap solamente).

### Haptics

`navigator.vibrate()` — soportado en Chrome/Android, **no soportado en
iOS Safari** (ninguna PWA en iOS tiene Vibration API, con o sin
instalar). Implementar como mejora opcional sin UI condicionada a su
disponibilidad: `apps/web/lib/haptics.ts` con una función `tap(pattern)`
que comprueba `"vibrate" in navigator` y no hace nada si no existe —
nunca debe haber una rama de UI distinta según haya o no soporte,
simplemente en Android vibra y en iOS no pasa nada. Eventos candidatos:
confirmar swipe (10ms), check-in exitoso (15ms), error (2×10ms).

---

## 0.8.9.5 — Social motion

- **Reacciones** (`activity-feed.tsx`): `.reaction-chip` ya tiene
  `:active{scale}` desde 0.8.7. Añadir, al confirmar una reacción
  nueva (no al quitarla), un pequeño "pop" sobre el emoji seleccionado:
  `scale(1 → 1.4 → 1)`, `--duration-fast`, sin partículas — la
  auditoría original sugería algo tipo Instagram con menú emergente al
  mantener pulsado; se deja fuera de esta fase por ser un rediseño de
  interacción (long-press + menú), no una animación sobre la
  interacción ya existente.
- **Campana de notificaciones**: al llegar una notificación nueva (el
  badge cambia), la campana hace `rotate(-8deg → 8deg → 0)`,
  `--duration-normal`; el número del badge entra con
  `scale(0 → 1.15 → 1)`.
- **Toasts**: si el sistema de toasts actual no anima su entrada,
  añadir `translateY(12px → 0) + opacity`, `--duration-fast`, entrada
  desde abajo (coherente con los bottom sheets de 0.8.9.4).

---

## 0.8.9.6 — Polish

- **Reordenación de ranking — hecho para la tabla, pendiente para el
  podio.** `apps/web/components/ranking-list.tsx` (PR 4) anima con FLIP
  (Web Animations API, `translateY`, 400ms, `--ease-spring`) las filas
  de la tabla de ranking (`/circulos/[circleId]`, puestos 4+) cuando
  cambian de orden entre renders del mismo árbol montado, comparando
  la posición de cada fila (por `userId`, key estable) antes/después
  vía `getBoundingClientRect()`. El podio (top 3) queda fuera de esta
  pieza: cambiar de puesto ahí implica también cambiar de tamaño de
  avatar y de columna, no un simple `translateY` — animarlo bien es un
  problema distinto, no una extensión trivial de esto.

  Nota honesta sobre cuándo se ve: como esta página no tiene datos en
  vivo (sin realtime, ver README), la reordenación solo es visible si
  el árbol de este componente sigue montado cuando cambian los datos
  (p. ej. un `router.refresh()` disparado desde esta misma página) —
  no en una navegación nueva a la página (ahí ya llega con el orden
  final, no hay nada que animar). Sigue siendo correcto implementarlo
  así: no hace nada visible cuando no aplica, y reordena bien cuando
  sí.

- **Empty states**: añadir una entrada sutil (`opacity + translateY(8px)`,
  `--duration-normal`) a los estados vacíos ya existentes
  ("Aún no hay actividad", "No tienes retos") — sin ilustraciones
  nuevas, es solo la transición de aparición.
- **Calendario**: al marcar un día como completado, `scale(0.8 → 1.15 → 1)`
  sobre la celda, `--duration-normal`, `--ease-spring`.
- **Errores**: en formularios con validación inline, un shake sutil
  (`translateX` ±4px, 2 ciclos, `--duration-fast`) en el campo con
  error al fallar la validación.

---

## Explícitamente fuera de alcance de esta fase

- Menú emergente de reacciones al mantener pulsado (rediseño de
  interacción, no animación).
- "Impact feedback" cross-usuario ("Raúl te ha adelantado" con overlay
  dedicado) — la notificación `RIVAL_AHEAD` ya existe desde 0.7.0; una
  presentación visual especial para ella es una decisión de producto
  sobre cuánta atención merece competir, no una animación.
- Burbujas/partículas de actividad ambientales en el feed — al no estar
  atadas a una acción del usuario que las ve, son las que más se
  acercan al patrón `shell-ambient` ya descartado; si se retoman, debe
  ser como respuesta puntual a una notificación push recibida en
  primer plano, no como decoración de fondo.
- Círculos como "mundos" (rediseño visual de la lista de círculos) —
  cambio de layout, no de motion.
- Transición de calendario tipo carrusel entre meses — evaluar junto
  con cualquier rediseño futuro del propio calendario, no aislado.

## Prioridad de implementación

| Prioridad | Piezas                                                                                                |
| --------- | ----------------------------------------------------------------------------------------------------- |
| **P0**    | 0.8.9.1 (tokens), 0.8.9.2 (swipe retos + validaciones)                                                |
| **P1**    | 0.8.9.3 (puntos, racha, XP, logros — sin confeti/rango todavía), 0.8.9.4 (bottom sheet de check-in)   |
| **P2**    | 0.8.9.3 (confeti, cambio de rango), 0.8.9.4 (pull-to-refresh, rubber band, haptics), 0.8.9.5, 0.8.9.6 |

Cada fila es al menos un PR independiente, mismo criterio que 0.8.x:
CI en verde antes de fusionar, especial atención si toca el flujo de
check-in/aceptación de reto (cubierto por el e2e crítico).

## Dependencias nuevas

Ninguna es necesaria. Todo lo anterior es alcanzable con Pointer
Events + CSS/Web Animations API nativos, consistente con el criterio ya
aplicado en 0.8.7 de no añadir una librería de animación sin
justificarlo primero.

## Archivos afectados (principales)

- `apps/web/app/globals.css` — tokens, `.reaction-chip` pop, shake.
- `apps/web/components/swipe-card.tsx` (nuevo)
- `apps/web/components/bottom-sheet.tsx` (nuevo)
- `apps/web/components/floating-points.tsx` (nuevo)
- `apps/web/lib/haptics.ts` (nuevo)
- `apps/web/components/challenge-actions.tsx`
- `apps/web/components/check-in-button.tsx`
- `apps/web/components/activity-feed.tsx`
- `apps/web/components/notification-list.tsx`
- `apps/web/app/(app)/validaciones/page.tsx` (+ su componente de
  revisión de evidencia)
- Ranking/podio del círculo (`apps/web/app/(app)/circulos/[circleId]/page.tsx`
  y su(s) componente(s) de tabla/podio)

---

## Inventario antes de implementar

Antes de tocar cualquier archivo, Codex debe inspeccionar el estado
actual del proyecto y contrastarlo con este documento — no asumir que
algo descrito aquí como "por implementar" sigue sin implementarse; el
código es la fuente de verdad, este documento no. Identificar como
mínimo:

- animaciones ya implementadas y sus componentes (`page-enter`,
  `.reaction-chip`, `.nav-item`, `.nav-create`, `@keyframes rise`,
  `@keyframes shimmer` en `globals.css`);
- clases CSS de motion existentes y si ya cubren algún token propuesto
  en la sección de abajo;
- transiciones de navegación (`apps/web/app/(app)/template.tsx`);
- optimistic UI ya implementado (0.8.5: `check-in-button.tsx`,
  `challenge-actions.tsx`, `activity-feed.tsx`, `friends-manager.tsx`,
  `notification-list.tsx`) — cualquier pieza nueva de motion sobre
  estas acciones debe integrarse en el estado que ya existe, no
  crear un segundo mecanismo paralelo;
- estados de loading y skeletons (`components/skeleton.tsx`, los
  `loading.tsx` de 0.8.2);
- modales/bottom sheets existentes (el modal de check-in actual, antes
  de sustituirlo);
- gestos ya implementados (ninguno a fecha de este documento, pero
  verificar antes de asumirlo).

No duplicar ninguna funcionalidad que ya exista.

## Matriz de implementación

Codex debe mantener esta tabla actualizada en cada PR que toque motion
— añadiendo filas si aparecen nuevas piezas y corrigiendo `Estado`
según lo que encuentre en el código, no según lo que diga esta tabla
en un momento dado:

| Feature                       | Estado        | Implementación                              | Prioridad | Observaciones                                                                                          |
| ----------------------------- | ------------- | ------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------ |
| Page transition               | existente     | CSS (`page-enter`, tokens)                  | P0        | Migrado a tokens (PR 1)                                                                                |
| Bottom nav animation          | existente     | CSS (`.nav-item`, tokens)                   | P0        | Migrado a tokens (PR 1)                                                                                |
| Press states                  | existente     | CSS (`--scale-pressed`)                     | P0        | Unificado con tokens (PR 1)                                                                            |
| Check-in delight              | hecho         | React + CSS (`.motion-pop` en "Enviado")    | P0        | Sin puntos flotantes, ver 0.8.9.3 (bloqueado)                                                          |
| Validaciones delight          | hecho         | `ReviewButtons` con estado optimista (PR 3) | P0        | No existía optimistic UI aquí (0.8.5 no lo cubrió)                                                     |
| Swipe cards (retos)           | hecho         | `SwipeCard` + `PendingChallengeCard` (PR 2) | P0        | Deck de `/circulos/[circleId]`                                                                         |
| Swipe cards (validaciones)    | bloqueado     | —                                           | P0        | Conflicto de eje con `.validation-deck` (scroll horizontal existente) — decisión de producto pendiente |
| Bottom sheet (check-in)       | hecho         | `BottomSheet` sobre Radix Dialog (PR 3)     | P0        | Reutilizable para futuros modales de confirmación                                                      |
| Ranking reorder (tabla)       | hecho         | `RankingList` con FLIP (PR 4)               | P0        | Podio (top 3) queda fuera, ver 0.8.9.6                                                                 |
| XP / nivel (barra + level-up) | pendiente     | —                                           | P1        | 0.8.9.3 — no requiere el delta de una acción, solo comparar valor anterior/nuevo entre renders         |
| Puntos flotantes (+N)         | bloqueado     | —                                           | P1        | Ver 0.8.9.3 — requiere que `review_check_in` (o una consulta aparte) exponga los puntos otorgados      |
| Racha (streak pulse)          | bloqueado     | —                                           | P1        | Mismo motivo que puntos flotantes                                                                      |
| Achievements unlock           | pendiente     | —                                           | P1        | 0.8.9.3                                                                                                |
| Reaction pop                  | parcial       | CSS (`.reaction-chip:active`)               | P1        | Añadir pop al confirmar                                                                                |
| Notification bell             | pendiente     | —                                           | P1        | 0.8.9.5                                                                                                |
| Toasts entrance               | por verificar | —                                           | P1        | Confirmar si el sistema actual ya anima                                                                |
| Confetti / rank-up            | pendiente     | —                                           | P2        | 0.8.9.3                                                                                                |
| Pull-to-refresh               | pendiente     | —                                           | P2        | 0.8.9.4                                                                                                |
| Haptics                       | pendiente     | —                                           | P2        | 0.8.9.4 (sin soporte iOS)                                                                              |
| Rubber band                   | pendiente     | —                                           | P2        | 0.8.9.4                                                                                                |
| Calendar day pop              | pendiente     | —                                           | P2        | 0.8.9.6                                                                                                |
| Error shake                   | pendiente     | —                                           | P2        | 0.8.9.6                                                                                                |
| Empty state entrance          | pendiente     | —                                           | P2        | 0.8.9.6                                                                                                |

## Componentes de motion compartidos

Crear una abstracción solo cuando reduce duplicación real, no por
sistema. Candidatos, sin obligación de crearlos todos:

- `SwipeCard` (0.8.9.2) — ya especificado, crear siempre.
- `BottomSheet` (0.8.9.4) — ya especificado, crear siempre (sustituye
  al modal de check-in y a cualquier otro modal de confirmación
  simple).
- `FloatingPoints` (0.8.9.3) — ya especificado.
- `MotionNumber` — si además del contador de puntos aparece la
  necesidad de animar otro número (nivel, racha), extraer un
  componente que interpole/anime el cambio de valor en vez de
  duplicar la lógica en cada sitio.
- `MotionToast` — solo si el sistema de toasts actual no tiene ya
  entrada/salida animable de forma sencilla.
- `Celebration` — un único componente parametrizado por
  `CelebrationLevel` (ver más abajo), no uno por tipo de evento.

No crear `MotionButton`, `MotionCard`, `MotionBadge`, `MotionIcon` ni
equivalentes genéricos sin un caso de uso concreto que lo justifique
— la mayoría de microinteracciones de este documento son una clase
CSS + un `data-state`, no necesitan un componente wrapper.

## Motion primitives

En vez de una librería de primitivas (`Motion.Pop`, `Motion.Fade`...),
usar clases CSS utilitarias sobre los tokens ya definidos —
consistente con que el proyecto no usa ninguna librería de animación:

```css
.motion-fade-in {
  animation: motion-fade-in var(--duration-normal) var(--ease-out) both;
}
.motion-pop {
  animation: motion-pop var(--duration-fast) var(--ease-spring) both;
}
.motion-slide-up {
  animation: motion-slide-up var(--duration-normal) var(--ease-out) both;
}
.motion-shake {
  animation: motion-shake var(--duration-fast) linear;
}
```

Añadir una nueva solo cuando dos o más piezas de este documento la
necesiten de forma idéntica; si es un caso único, la animación vive
en el componente que la usa.

## Arquitectura de Swipe Card

Interfaz mínima de `swipe-card.tsx` (complementa la descripción de
comportamiento ya dada en 0.8.9.2):

```ts
interface SwipeCardProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // fracción del ancho, por defecto 0.4
  disabled?: boolean;
  children: React.ReactNode;
}
```

Debe soportar Pointer Events (cubre touch y mouse a la vez, sin
listeners duplicados), cancelación del gesto (soltar por debajo del
umbral = snap-back), rotación y feedback visual proporcional al
arrastre, y degradar a estático si `prefers-reduced-motion` está
activo (sin interpolar, salta directo al resultado del swipe si se
completa).

**No negociable:** el swipe nunca es la única forma de completar la
acción. `[ Rechazar ]` / `[ Aceptar ]` (ya existentes en
`challenge-actions.tsx`) se mantienen siempre visibles y funcionales,
swipe es un atajo sobre ellos, no un reemplazo.

## Fallback de escritorio

Pique es mobile-first, pero debe seguir siendo usable en escritorio:

|                          | Móvil     | Escritorio                    |
| ------------------------ | --------- | ----------------------------- |
| Acción principal de card | swipe     | click en botón                |
| Descartar bottom sheet   | drag down | click en backdrop / tecla Esc |
| Reaccionar               | tap       | click                         |

Ningún gesto táctil debe ser la única vía — `SwipeCard` y
`BottomSheet` deben funcionar por completo solo con click/teclado.

## Animaciones de error

Campos de formulario con validación inline: shake sutil al fallar
(`translateX` ±4px, 2 ciclos, `--duration-fast`, ~250ms total). El
error debe llevar siempre el mensaje de texto correspondiente — el
shake es refuerzo, nunca la única señal de que algo falló.

## Loading interactivo

Evitar el texto genérico "Loading..." cuando ya existe un skeleton
aplicable (0.8.2). Para acciones puntuales sobre un botón pequeño
(no una carga de página), sustituir el label por un indicador breve
(p. ej. tres puntos) sin bloquear el resto de la pantalla — mismo
principio que los estados "Aceptando…/Rechazando…" ya implementados
en `challenge-actions.tsx`.

## Optimistic UI + motion

La animación arranca en el momento del tap, no cuando responde el
servidor — coherente con el patrón ya usado en toda la fase 0.8.5:

```text
tap → estado optimista + animación → petición en segundo plano → éxito (sin cambio visual adicional)
                                                                 → error → revertir + feedback de error
```

Ninguna pieza nueva de este documento debe esperar la respuesta del
servidor antes de animar.

## Motion y competición

Prioridad de peso visual, de mayor a menor — define qué eventos
merecen más protagonismo cuando haya que decidir entre pulir uno u
otro primero:

1. Adelantar a otro jugador en el ranking.
2. Ganar un reto.
3. Alcanzar/mantener una racha.
4. Subir de nivel.
5. Conseguir un logro.
6. Validar/rechazar una evidencia.
7. Reaccionar.
8. Navegar.

## Eventos de importancia

No todas las acciones deben pesar visualmente lo mismo:

| Nivel      | Ejemplo                      | Duración                                   |
| ---------- | ---------------------------- | ------------------------------------------ |
| Micro      | reacción                     | 100–200ms                                  |
| Medio      | check-in                     | 300–700ms                                  |
| Importante | logro, victoria, nuevo rango | 500–1000ms (rango: hasta ~2s, ver 0.8.9.3) |

## Sistema de celebraciones

Un único componente `Celebration` parametrizado por nivel, no uno por
tipo de evento:

```ts
type CelebrationLevel = "none" | "micro" | "medium" | "major";
```

- `none` → navegación, no dispara `Celebration`.
- `micro` → reacción (pop del emoji, sin overlay).
- `medium` → check-in, logro desbloqueado (feedback inline, sin
  overlay a pantalla completa).
- `major` → victoria de reto, cambio de rango (único nivel con overlay
  a pantalla completa, ver 0.8.9.3).

## Celebraciones no repetitivas

Una celebración `major`/`medium` debe dispararse solo cuando el evento
**ocurre**, no cada vez que se consulta su resultado. Ejemplo concreto:
al reabrir la página de logros, un logro ya desbloqueado se muestra en
su estado final directamente — no debe volver a jugar la animación de
desbloqueo. Si aparece la necesidad de repetir un evento con
frecuencia (p. ej. `RIVAL_AHEAD` cambiando varias veces en poco
tiempo), aplicar un cooldown razonable antes de repetir la
celebración completa.

## Accesibilidad

Todas las piezas de este documento deben, sin excepción:

- respetar `prefers-reduced-motion` (ya global en `globals.css`);
- mantener información textual equivalente a la animación (un shake
  no sustituye al mensaje de error, un swipe no sustituye al botón);
- mantener controles accesibles sin gesto ni mouse (teclado como
  mínimo para las acciones críticas: aceptar/rechazar reto, aprobar/
  rechazar validación);
- no depender solo del color ni solo del movimiento para comunicar
  estado.

## Performance budget

Antes de añadir una animación con más de un elemento en movimiento,
evaluar coste real (no solo si "se ve fluido" en el Mac de
desarrollo — ver la limitación de hardware ya documentada en la
auditoría de 0.8.8). En particular:

- nunca generar partículas DOM en cantidades de cientos (confeti:
  20–40 elementos como mucho, un único disparo, nunca en bucle);
- nunca dejar una animación corriendo durante scroll activo si no es
  la razón de ser de esa interacción (pull-to-refresh sí, cualquier
  otra cosa no);
- medir en dispositivo real o emulación de gama baja antes de dar por
  cerrado un PR de esta fase, no solo `prefers-reduced-motion`
  desactivado en un portátil potente.

## Testing

Cada interacción nueva de esta fase debe probarse, como mínimo, en:
Safari iOS y Chrome Android (móvil), Chrome/Safari de escritorio (los
gestos deben tener fallback de click), con `prefers-reduced-motion`
activado, y en los estados éxito/error/carga de la acción que anima
(no solo el camino feliz).

## Definition of Done

Una pieza de esta fase no se considera terminada hasta que:

- sigue lo especificado en este documento (o el documento se ha
  actualizado si se decidió desviarse, y por qué);
- reutiliza tokens/primitivas/componentes existentes cuando aplica,
  en vez de duplicar;
- funciona en móvil y tiene fallback funcional en escritorio;
- tiene alternativa accesible sin gesto;
- respeta `prefers-reduced-motion`;
- no introduce layout shift;
- CI en verde (mismo criterio que el resto del proyecto: `format:check`,
  `lint`, `typecheck`, `test`, `build`, `test:e2e` si toca un flujo
  cubierto por e2e);
- se ha probado visualmente, no solo verificado por tipos/tests.

## Regla final antes de añadir cualquier animación

1. ¿Qué comunica?
2. ¿A qué acción del usuario responde?
3. ¿Mejora la percepción de velocidad, o solo decora?
4. ¿Refuerza la competición (ver "Motion y competición")?
5. ¿Es consistente con una interacción ya existente en este
   documento, o introduce un lenguaje nuevo sin necesidad?
6. ¿Puede reutilizar un token/primitiva/componente ya definido aquí?
7. ¿Su coste de rendimiento es razonable (ver "Performance budget")?
8. ¿Sigue siendo usable con `prefers-reduced-motion` activado?

Si la respuesta a "qué comunica" es "queda bonita" y nada más, no se
implementa.

## Plan de trabajo recomendado

El orden de ejecución no sigue el orden numérico de las subfases
0.8.9.1–0.8.9.6 tal cual — se reagrupa por impacto y por lo que hace
falta verificar en producto antes de seguir, para poder probar Pique
entre bloques y corregir el lenguaje visual si algo queda sobrecargado
antes de que se replique por el resto de la app:

| PR                          | Cubre                                                                                                                         | Piezas de este documento          |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| 1. Motion foundation ✅     | Tokens, primitivas CSS, migrar `page-enter`/`.reaction-chip`/`.nav-item` — [#36](https://github.com/raulruiz78/pique/pull/36) | 0.8.9.1                           |
| 2. Swipe cards              | `SwipeCard`, aplicado al deck de retos (validaciones bloqueadas, ver 0.8.9.2)                                                 | 0.8.9.2                           |
| 3. Check-in delight ✅      | `BottomSheet` en el modal de check-in, `.motion-pop` en check-in y validaciones — puntos/racha bloqueados, ver 0.8.9.3        | 0.8.9.4 (bottom sheet)            |
| 4. Ranking animations ✅    | Reordenación animada de la tabla (FLIP), podio queda fuera                                                                    | 0.8.9.6 (ranking reorder)         |
| 5. Gamification motion      | XP/nivel, logros, confeti, cambio de rango, `Celebration`                                                                     | 0.8.9.3 (resto)                   |
| 6. Social motion            | Pop de reacción, campana, toasts                                                                                              | 0.8.9.5                           |
| 7. Mobile gestures + polish | Pull-to-refresh, rubber band, haptics, calendario, empty states, error shake                                                  | 0.8.9.4 (resto) + 0.8.9.6 (resto) |

Cada fila es un PR independiente con su propio CI en verde, igual que
0.8.x. No agrupar varias filas en un mismo PR aunque el cambio parezca
pequeño — el objetivo explícito de este orden es poder frenar o
ajustar el lenguaje visual entre bloques, no solo dividir por tamaño
de diff.

## Documentación

Cuando un PR de esta fase introduce un patrón nuevo (un token, una
primitiva, un componente compartido), cambia uno ya definido en este
documento, o descubre una limitación técnica no anticipada aquí (como
ya pasó con `unoptimized` en `Avatar`, 0.8.6), este documento se
actualiza en el mismo PR — no se espera a que se pida.

## Antes de implementar cualquier pieza de esta fase

1. Leer `AGENTS.md`.
2. Releer este documento completo, no solo la sección de la pieza a
   implementar.
3. Inspeccionar la implementación actual (ver "Inventario antes de
   implementar").
4. Actualizar la "Matriz de implementación" si el estado real
   difiere de lo que refleja.
5. Implementar siguiendo el PR correspondiente del "Plan de trabajo
   recomendado".
6. Ejecutar la misma suite de verificación que el resto del proyecto.
7. Documentar cualquier patrón nuevo o desviación en este archivo.
8. Actualizar `Roadmap.md` (fase 0.8.9) si el estado de la fase
   cambia.

El código del repositorio es siempre la fuente de verdad sobre lo que
ya está implementado — nunca asumir que el estado real coincide con
lo descrito aquí sin haberlo comprobado.
