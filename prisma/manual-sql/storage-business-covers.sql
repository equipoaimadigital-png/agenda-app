-- Bucket de Supabase Storage para las imagenes de portada de cada negocio.
-- No es parte de las migraciones de Prisma (toca el schema "storage", que
-- Prisma no modela) — se aplico manualmente contra la base de produccion.
-- Se deja aca como referencia por si hay que recrearlo en otro proyecto.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('business-covers', 'business-covers', true, 5242880, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do nothing;

create policy "public read business covers"
on storage.objects for select
to public
using (bucket_id = 'business-covers');

create policy "authenticated upload business covers"
on storage.objects for insert
to authenticated
with check (bucket_id = 'business-covers');

create policy "owner update business covers"
on storage.objects for update
to authenticated
using (bucket_id = 'business-covers' and owner = auth.uid());

create policy "owner delete business covers"
on storage.objects for delete
to authenticated
using (bucket_id = 'business-covers' and owner = auth.uid());
