-- Las evidencias (fotos) se guardaban para siempre tras revisarse, sin
-- ninguna forma de limpiarlas. Se permite borrar la evidencia (fila y
-- objeto en Storage) una vez el check-in ya tiene una decisión final
-- (APPROVED/REJECTED) — antes de eso no, para no romper el flujo de
-- revisión que todavía necesita mostrar la foto. La limpieza real (borrar
-- el blob de Storage) la hace la ruta de la API tras la revisión, usando
-- estos permisos nuevos; esta migración solo abre la puerta en RLS.
create policy evidence_reviewed_delete on public.evidence
for delete
using (
  exists (
    select 1
    from public.check_ins c
    where c.id = check_in_id
      and c.status in ('APPROVED', 'REJECTED')
      and public.is_challenge_participant(c.challenge_id)
  )
);

create policy evidence_storage_reviewed_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'evidence'
  and exists (
    select 1
    from public.evidence e
    join public.check_ins c on c.id = e.check_in_id
    where e.storage_path = name
      and c.status in ('APPROVED', 'REJECTED')
      and public.is_challenge_participant(c.challenge_id)
  )
);
