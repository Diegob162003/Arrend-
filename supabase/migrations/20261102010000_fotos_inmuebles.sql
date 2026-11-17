-- Fotos de los inmuebles en un bucket privado. Se leen solo con URL firmada.
-- Ruta de cada archivo: {arrendador_id}/{inmueble_id}/{nombre}.jpg
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('inmuebles', 'inmuebles', false, 5242880, array['image/jpeg', 'image/webp']);

-- Dueño de la carpeta del inmueble: la ruta debe empezar por su id y por un inmueble suyo.
create function privado.es_dueno_de_ruta_inmueble(ruta text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  -- El case evita convertir a uuid una ruta mal formada.
  select case
    when (storage.foldername(ruta))[1] = (select auth.uid())::text
     and (storage.foldername(ruta))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then exists (
      select 1 from public.inmuebles
       where id = (storage.foldername(ruta))[2]::uuid
         and arrendador_id = (select auth.uid())
    )
    else false
  end;
$$;

create function privado.puede_ver_ruta_inmueble(ruta text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select privado.es_dueno_de_ruta_inmueble(ruta)
      or case
           when (storage.foldername(ruta))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
           then privado.es_inquilino_de_inmueble((storage.foldername(ruta))[2]::uuid)
           else false
         end;
$$;

revoke execute on all functions in schema privado from public, anon;
grant execute on all functions in schema privado to authenticated;

create policy "inmuebles: el arrendador y sus inquilinos ven las fotos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'inmuebles' and privado.puede_ver_ruta_inmueble(name));

create policy "inmuebles: el arrendador sube fotos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'inmuebles' and privado.es_dueno_de_ruta_inmueble(name));

create policy "inmuebles: el arrendador borra fotos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'inmuebles' and privado.es_dueno_de_ruta_inmueble(name));
