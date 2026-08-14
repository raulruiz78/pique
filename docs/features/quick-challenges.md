# Retos rápidos

**Estado: pendiente de definición de producto — probablemente la
decisión más importante de las tres pendientes de 0.8.0.** No
implementar hasta que este documento se actualice con la decisión
tomada; "reto rápido" puede significar productos muy distintos entre
sí, así que no se debe asumir ninguna de las opciones de abajo por
defecto.

## Opciones sobre la mesa (no excluyentes entre sí, a decidir)

- [ ] Reto de duración corta y fija (p. ej. 24 horas)
- [ ] Reto de una única acción puntual, sin recurrencia
- [ ] Competición instantánea (empieza en el momento, sin fase de
      aceptación previa)
- [ ] Reto generado directamente desde una plantilla, sin pasar por el
      asistente completo (relacionado con las plantillas ya
      implementadas en `challenge-templates.ts`, pero con menos pasos
      aún)
- [ ] Formato "primer usuario que..." (carrera por ser el primero)
- [ ] Reto sin ninguna configuración manual (todo por defecto)
- [ ] Reto que aparece/se sugiere automáticamente, sin que nadie lo
      cree explícitamente

## Preguntas abiertas

- [ ] ¿Qué combinación de las opciones de arriba define "reto rápido"?
- [ ] ¿Sustituye o convive con el asistente de creación actual
      (`challenge-wizard.tsx`)?
- [ ] ¿Tiene su propia entrada en la navegación o vive dentro del flujo
      existente de creación?
- [ ] ¿Afecta al modelo de datos actual (`challenges`/`goals`/
      `goal_occurrences`) o encaja sin cambios de esquema?

## Decisión

_(pendiente)_
