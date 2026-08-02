insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-images',
  'profile-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy profile_circle_images_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'profile-images'
  and (
    (
      (storage.foldername(name))[1] = 'profiles'
      and (storage.foldername(name))[2] = auth.uid()::text
    )
    or (
      (storage.foldername(name))[1] = 'circles'
      and exists (
        select 1 from public.circles
        where id::text = (storage.foldername(name))[2]
          and owner_id = auth.uid()
      )
    )
  )
);

create policy profile_circle_images_read on storage.objects
for select to authenticated
using (
  bucket_id = 'profile-images'
  and (
    exists (
      select 1 from public.profiles profile
      where profile.avatar_path = name
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
      where circle.avatar_path = name
        and (circle.owner_id = auth.uid() or public.is_circle_member(circle.id))
    )
  )
);

create policy profile_circle_images_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'profile-images'
  and (
    (
      (storage.foldername(name))[1] = 'profiles'
      and (storage.foldername(name))[2] = auth.uid()::text
    )
    or (
      (storage.foldername(name))[1] = 'circles'
      and exists (
        select 1 from public.circles
        where id::text = (storage.foldername(name))[2]
          and owner_id = auth.uid()
      )
    )
  )
);
