# Instrucciones para agentes

## Funcionalidades pendientes de definición de producto

Antes de implementar, consulta:

- Comentarios → `docs/features/comments.md`
- Compartir resultados → `docs/features/result-sharing.md`
- Retos rápidos → `docs/features/quick-challenges.md`

Cuando una funcionalidad del roadmap tenga decisiones de producto
explícitamente marcadas como pendientes en su documento de
`docs/features/`, el agente **no debe inventar esas decisiones**. Debe
detener la implementación y solicitar la definición al product owner.

Hay una diferencia entre "implementa siguiendo el criterio existente" y
"decide qué producto queremos construir". Lo primero es trabajo del
agente; lo segundo le corresponde al product owner.

Cuando se tome una decisión de producto sobre alguna de estas
funcionalidades, se documenta en su archivo correspondiente dentro de
`docs/features/`, no en este archivo.

## Motion & UX

Cuando trabajes en animaciones, microinteracciones o gestos:

1. Lee `docs/features/motion-system.md` completo, no solo la sección
   de la pieza que vas a tocar.
2. Inspecciona primero la implementación existente (ver su sección
   "Inventario antes de implementar") — el código es la fuente de
   verdad, no el documento.
3. No implementes una interacción que ya exista; extiende o migra la
   que haya.
4. No inventes decisiones de UX nuevas si ese documento ya define un
   patrón, un token o una prioridad para el caso.
5. Prioriza reutilización de tokens/primitivas/componentes ya
   definidos antes de crear uno nuevo.
6. Respeta las prioridades P0/P1/P2 y el orden de PRs de su "Plan de
   trabajo recomendado" — no agrupes varias piezas en un mismo PR.
7. Actualiza `docs/features/motion-system.md` (y su "Matriz de
   implementación") en el mismo PR si introduces un patrón nuevo o
   descubres una limitación no anticipada.

## Tono de los textos

Pique no es una app formal. Cualquier texto nuevo de cara al usuario
(copys de botones, avisos, notificaciones, estados vacíos, ayudas de
formulario) debe sonar a herramienta de motivación/competición — "picar"
al usuario —, no a ficha técnica ni a mensaje de sistema. Segunda
persona, corto, con la actitud competitiva que ya tienen textos como "¿A
qué os vais a picar?" o "🔥 Se te acaba la racha". Antes de escribir un
texto nuevo, mira cómo suena uno ya existente en la misma pantalla y
calca el registro — no inventes un tono neutro "porque es lo seguro".

## UI: tarjetas pulsables antes que controles web genéricos

Para elecciones cerradas (círculo, cadencia, validación, puntos…),
prioriza tarjetas/pills pulsables (`.choice-card`, pills con
`aria-pressed`) sobre `<select>`/desplegables o campos de texto libre sin
restringir — encajan peor con el resto de la app, que es mobile-first de
principio a fin. Reutiliza el patrón ya usado para el modo de cadencia en
`challenge-wizard.tsx` antes de inventar uno nuevo. Si una elección debe
quedar restringida a un conjunto fijo de valores (p. ej. puntos por
check-in: 5/10/20, para no romper rankings/medallas), no lo apliques solo
en el cliente — duplica la validación dentro de la función `security
definer` correspondiente, ya que esas funciones son invocables
directamente por cualquier cliente autenticado, sin pasar por la API.

## Entorno local: no reutilices secretos de producción

Al preparar `apps/web/.env.local` en una máquina nueva, genera
credenciales propias para lo que no dependa de datos compartidos (VAPID,
`CRON_SECRET`) en vez de copiar las de producción — es además lo que ya
recomienda `docs/deployment/LOCAL.md`. Si intentas copiar un secreto real
tirado de Vercel/producción a través de una captura de shell (`$(...)`),
el entorno en sandbox puede sustituirlo silenciosamente por un
placeholder sin avisar; failure mode observado: `web-push` fallando con
"Vapid subject is not a valid URL" porque el valor real nunca llegó al
fichero. Si algo así falla sin motivo aparente, sospecha primero de esto
antes de perder tiempo depurando el código de la app.
