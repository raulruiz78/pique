-- Pedido explícito: el creador también puede eliminar un reto que ya está
-- en marcha (ACTIVE), no solo antes de empezar. Esto implica borrar en
-- cascada el historial de check-ins/puntuación de los demás participantes
-- en ese reto — es intencional, decisión del product owner. COMPLETED se
-- mantiene fuera: es el registro ya cerrado de una competición terminada,
-- no algo que limpiar.
drop policy if exists challenges_creator_delete on public.challenges;

create policy challenges_creator_delete on public.challenges
for delete
using (
  creator_id = auth.uid()
  and status in ('DRAFT', 'PENDING_ACCEPTANCE', 'SCHEDULED', 'ACTIVE')
);
