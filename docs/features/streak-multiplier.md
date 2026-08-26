# Multiplicador de racha

**Estado: implementado (migración `202608260031_streak_multiplier.sql`).**

Reto opt-in: al crearlo, el creador puede activar "Multiplicador de
racha" (`goals.streak_multiplier_enabled`). Si está activo, cada check-in
aprobado se multiplica por `min(2, 1 + 0.05 × streak_days)`, redondeado
hacia abajo. Si el reto no lo tiene activo, no se muestra ningún
indicador — ni en `/hoy` ni en la vista de círculo. Si lo tiene activo,
siempre se muestra el valor, incluida la racha en x1.00.

## Por qué la racha se cuenta en "unidades de cadencia", no en check-ins

`challenge_participants.streak_days` es un contador nuevo, separado de
`current_streak` (que sigue significando "aprobaciones consecutivas" a
nivel de perfil, para las medallas de 7/30 días — sin cambios). Solo sube
+1 cuando se completa una unidad **entera**: un día para retos fijos o de
varias veces al día, una semana para los flexibles (`FLEX=N`). Contar por
check-in individual habría hecho que un reto de 3 veces/día llegara al
tope x2 tres veces más rápido que uno diario con el mismo esfuerzo
sostenido — ver `_apply_check_in_approval` en la migración para el
cálculo del "bucket" (por `goal_id` + `participant_id` + rango de fecha).

Si falla cualquier ocurrencia de la unidad (expira sin check-in, o queda
rechazada y nunca se reenvía — ver más abajo), `streak_days` vuelve a 0.
Es deliberado: la racha se pierde entera al fallar, no se suaviza.

## SLA de validación: auto-aprobado a las 24h

`auto_approve_stale_check_ins()` (llamado desde el cron de
`apps/web/app/api/v1/cron/maintenance/route.ts`) aprueba automáticamente
cualquier check-in que lleve más de 1 día en `PENDING_REVIEW`, anclado a
`submitted_at` (no a `closes_at` de la ocurrencia). Anclarlo a
`submitted_at` es necesario para los retos flexibles: su ocurrencia no
cierra hasta el fin de semana, así que anclar al cierre habría dejado una
validación pendiente hasta 7 días en vez de 1. Esto evita que un
validador lento (o que directamente no valide nunca) retenga la racha del
otro participante como rehén — relevante ahora que la racha vale puntos
reales.

## Dos huecos cerrados en la misma migración

1. **Autovalidación nunca puntuaba.** Los retos con
   `validation_type = 'SELF'` marcan el check-in como `APPROVED` al
   instante en `submit_check_in`, pero solo `review_check_in` otorgaba
   puntos — y esa función exige `PENDING_REVIEW`, estado por el que un
   check-in autovalidado nunca pasa. Bug preexistente, independiente de
   esta feature, pero si no se arreglaba aquí el multiplicador nunca se
   habría aplicado a esos retos.
2. **Un rechazo abandonado no rompía la racha.** El cron de mantenimiento
   solo expiraba ocurrencias en estado `PENDING` (nunca tocadas); una
   ocurrencia `REJECTED` sin reenviar quedaba fuera de ese barrido para
   siempre — un colador para conservar racha sin currárselo. El cron
   ahora expira también `REJECTED` con `closes_at` ya pasado.

La lógica de puntuación/racha compartida por `review_check_in`,
`submit_check_in` (rama `SELF`) y el auto-aprobado por SLA vive en
`public._apply_check_in_approval` para no triplicarla.

## UI

`apps/web/components/multiplier-badge.tsx` — pill lima de alto contraste
(`.pill-lime`, ya usada para la racha en `/perfil`) con una entrada
`.motion-pop` de una sola vez. **No** es un brillo/pulso en bucle: la
regla no negociable de `docs/features/motion-system.md` prohíbe
animaciones continuas ("sombras pulsantes" incluidas explícitamente,
precedente: `shell-ambient` se quitó en 0.8.7 por esto). "Llamativo" se
consigue por contraste de color, no por movimiento perpetuo. Se muestra
en `/hoy` (junto al objetivo de hoy) y en la vista de círculo (junto al
título del reto, marcador propio, no el de los rivales).
