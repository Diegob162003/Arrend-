-- Contrato firmado: el arrendador sube el PDF escaneado y el contrato queda vigente.
-- Ruta del archivo: {arrendador_id}/{contrato_id}/firmado.pdf
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('contratos', 'contratos', false, 10485760, array['application/pdf']);

-- firmado_path solo puede apuntar a la carpeta del propio contrato.
alter table public.contratos
  add constraint contratos_firmado_path check (
    firmado_path is null or firmado_path = arrendador_id::text || '/' || id::text || '/firmado.pdf'
  );

-- Una vez firmado, lo que dice el papel no cambia. El canon y la fecha de fin
-- quedan libres para el incremento anual (T15) y las prórrogas.
create function public.proteger_contrato_firmado()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.estado <> 'borrador' and (
       new.inmueble_id, new.fecha_inicio, new.dia_pago, new.garantia_tipo,
       new.clausulas_adicionales, new.firmado_path
     ) is distinct from (
       old.inmueble_id, old.fecha_inicio, old.dia_pago, old.garantia_tipo,
       old.clausulas_adicionales, old.firmado_path
     ) then
    raise exception 'El contrato ya está firmado y sus términos no se pueden cambiar.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger contratos_proteger_firmado
  before update on public.contratos
  for each row execute function public.proteger_contrato_firmado();

-- La ruta debe ser {su id}/{un contrato suyo en borrador}/firmado.pdf.
create function privado.puede_subir_firmado(ruta text)
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
     and storage.filename(ruta) = 'firmado.pdf'
    then exists (
      select 1 from public.contratos
       where id = (storage.foldername(ruta))[2]::uuid
         and arrendador_id = (select auth.uid())
         and estado = 'borrador'
    )
    else false
  end;
$$;

create function privado.puede_ver_firmado(ruta text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (storage.foldername(ruta))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then privado.es_parte_de((storage.foldername(ruta))[2]::uuid)
    else false
  end;
$$;

revoke execute on all functions in schema privado from public, anon;
grant execute on all functions in schema privado to authenticated;

create policy "contratos: las partes ven el firmado"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'contratos' and privado.puede_ver_firmado(name));

-- Mientras el contrato es borrador el arrendador puede subirlo de nuevo si se
-- equivocó de archivo; al quedar vigente el archivo ya no se toca.
create policy "contratos: el arrendador sube el firmado"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'contratos' and privado.puede_subir_firmado(name));

create policy "contratos: el arrendador reemplaza el firmado"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'contratos' and privado.puede_subir_firmado(name))
  with check (bucket_id = 'contratos' and privado.puede_subir_firmado(name));
