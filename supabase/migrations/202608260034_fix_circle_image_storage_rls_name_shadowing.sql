-- Las fotos de círculo se subían bien pero nunca se veían, ni para el
-- propio dueño: en profile_circle_images_read, la rama de círculo
-- comparaba `circle.avatar_path = name` esperando que `name` fuera la
-- columna de la consulta externa (storage.objects.name, la ruta del
-- objeto) — pero public.circles tiene su PROPIA columna `name` (el
-- nombre del círculo), así que Postgres resuelve el `name` sin
-- cualificar contra esa columna local en vez de correlacionar con la
-- externa. La cláusula se convertía en `circle.avatar_path =
-- circle.name`, prácticamente nunca cierta. La rama gemela de perfil no
-- tenía este problema porque public.profiles no tiene columna `name`
-- (solo username/display_name), así que ahí sí correlacionaba bien.
--
-- El mismo patrón (name sin cualificar dentro de una subconsulta contra
-- circles) también está en las políticas de insert y delete, aunque ahí
-- no se notaba tanto: la subida usa URLs firmadas (no pasa por esta
-- política) y el borrado fallaba en silencio sin dejar rastro visible
-- más allá de un archivo huérfano en Storage. Se corrigen las tres para
-- que sean consistentes y correctas.
drop policy if exists profile_circle_images_insert on storage.objects;
create policy profile_circle_images_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'profile-images'
  and (
    (
      (storage.foldername(storage.objects.name))[1] = 'profiles'
      and (storage.foldername(storage.objects.name))[2] = auth.uid()::text
    )
    or (
      (storage.foldername(storage.objects.name))[1] = 'circles'
      and exists (
        select 1 from public.circles
        where id::text = (storage.foldername(storage.objects.name))[2]
          and owner_id = auth.uid()
      )
    )
  )
);

drop policy if exists profile_circle_images_read on storage.objects;
create policy profile_circle_images_read on storage.objects
for select to authenticated
using (
  bucket_id = 'profile-images'
  and (
    exists (
      select 1 from public.profiles profile
      where profile.avatar_path = storage.objects.name
        and (
          profile.id = auth.uid()
          or exists (
            select 1
            from public.circle_members mine
            join public.circle_members theirs on theirs.circle_id = mine.circle_id
            where mine.user_id = auth.uid()
              and theirs.user_id = profile.id
          )
        )
    )
    or exists (
      select 1 from public.circles circle
      where circle.avatar_path = storage.objects.name
        and (circle.owner_id = auth.uid() or public.is_circle_member(circle.id))
    )
  )
);

drop policy if exists profile_circle_images_delete on storage.objects;
create policy profile_circle_images_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'profile-images'
  and (
    (
      (storage.foldername(storage.objects.name))[1] = 'profiles'
      and (storage.foldername(storage.objects.name))[2] = auth.uid()::text
    )
    or (
      (storage.foldername(storage.objects.name))[1] = 'circles'
      and exists (
        select 1 from public.circles
        where id::text = (storage.foldername(storage.objects.name))[2]
          and owner_id = auth.uid()
      )
    )
  )
);
