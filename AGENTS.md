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
