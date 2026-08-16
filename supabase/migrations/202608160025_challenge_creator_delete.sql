-- El creador de un reto puede eliminarlo, pero solo antes de que tenga
-- actividad real de la que dependan otros participantes (check-ins,
-- puntuación, historial) — evita borrar el juego de alguien más. Una vez
-- ACTIVE/COMPLETED/etc. el reto ya no es eliminable por esta vía.
grant delete on table public.challenges to authenticated;

create policy challenges_creator_delete on public.challenges
for delete
using (
  creator_id = auth.uid()
  and status in ('DRAFT', 'PENDING_ACCEPTANCE', 'SCHEDULED')
);
