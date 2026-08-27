# Coins y comodines por círculo

**Estado: implementado (migración `202608270035_circle_coins_and_shields.sql`).**

Recompensa la constancia con una moneda propia, separada del todo de la
puntuación de ranking, para poder gastarla en saltarte un check-in sin
que afecte a quién va ganando.

## Mecánica

- **Ganar**: cada vez que `_apply_check_in_approval` otorga puntos reales
  (validación por rival, autovalidación o auto-aprobado por SLA — en
  cualquier caso menos `is_shield`, que no otorga nada), esos mismos
  puntos se abonan 1:1 como coins a `circle_members.coin_balance` del
  círculo de ese reto. Es un contador en paralelo — nunca resta de
  `challenge_participants.score`.
- **Comprar** (`purchase_circle_shield`): 1000 coins → +1 a
  `circle_members.shield_count`. Falla con `INSUFFICIENT_COINS` si no
  llegas.
- **Canjear** (`redeem_circle_shield`): sobre una ocurrencia propia,
  pendiente o rechazada, dentro de su ventana — la marca `APPROVED` con
  `check_ins.via_shield = true`, sin evidencia. Corre la misma
  continuidad de racha que una aprobación normal (bucket de
  `streak_days`, `current_streak`/`best_streak`) pero **no** otorga
  puntos ni coins nuevos — si diera algo, el sistema se alimentaría solo.

## Por qué es una tabla de movimientos, no solo un saldo

`circle_coin_transactions` es un histórico apend-only (mismo patrón que
`score_transactions`), no solo las columnas de saldo en
`circle_members`. Pensado para que el día que se añadan micropagos
reales, comprar coins con dinero sea insertar una fila más con
`source_type = 'PURCHASED_REAL_MONEY'` (o similar), sin tocar el resto
del sistema.

## Transparencia

Un check-in resuelto con comodín se marca de forma visible y distinta
de una validación real: tipo de actividad `CHECK_IN_SHIELDED` en el feed
del círculo, y pill "COMODÍN" en `/mis-pruebas` — pedido explícitamente
para que el resto del círculo sepa que ese día no fue una validación de
verdad.

## Decisiones tomadas al diseñarlo

- **No hay tope al inventario de comodines** — 1000 coins ya es un
  umbral exigente (semanas de constancia real); si se detecta abuso
  (acumular muchos y usarlos seguidos para fingir racha sin esfuerzo
  sostenido), se revisita entonces.
- **El uso es siempre proactivo** — el usuario pulsa "usar comodín"
  sobre el check-in que va a perder; nunca se gasta un comodín en
  automático sin que el usuario lo pida.
