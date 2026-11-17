-- Actas de inventario (entrega y devolución) y sus ítems con foto.
create type public.tipo_inventario as enum ('entrega', 'devolucion');

create table public.inventarios (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos (id) on delete cascade,
  tipo public.tipo_inventario not null,
  -- Cuando las dos fechas están llenas el acta queda cerrada.
  aceptado_arrendador_en timestamptz,
  aceptado_inquilino_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint inventarios_uno_por_tipo unique (contrato_id, tipo)
);

comment on table public.inventarios is 'Acta de entrega o devolución; se bloquea cuando ambas partes la aceptan.';

create table public.items_inventario (
  id uuid primary key default gen_random_uuid(),
  inventario_id uuid not null references public.inventarios (id) on delete cascade,
  creado_por uuid not null default auth.uid() references public.usuarios (id) on delete cascade,
  ambiente text not null check (char_length(ambiente) between 2 and 60),
  descripcion text not null check (char_length(descripcion) between 2 and 1000),
  foto_path text,
  -- SHA-256 de la foto original: prueba de que no se cambió después.
  foto_hash text check (foto_hash ~ '^[0-9a-f]{64}$'),
  foto_tomada_en timestamptz,
  orden integer not null default 0,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint items_inventario_foto_completa check ((foto_path is null) = (foto_hash is null))
);

comment on table public.items_inventario is 'Elemento del acta por ambiente, con su foto y el hash de la foto.';

create index inventarios_contrato_id_idx on public.inventarios (contrato_id);
create index items_inventario_inventario_id_idx on public.items_inventario (inventario_id);
create index items_inventario_creado_por_idx on public.items_inventario (creado_por);

create trigger inventarios_actualizado_en
  before update on public.inventarios
  for each row execute function public.tocar_actualizado_en();

create trigger items_inventario_actualizado_en
  before update on public.items_inventario
  for each row execute function public.tocar_actualizado_en();

-- ---------------------------------------------------------------------------
-- Funciones de apoyo
-- ---------------------------------------------------------------------------
create function privado.es_parte_de_inventario(inventario uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.inventarios i
      join public.contratos c on c.id = i.contrato_id
     where i.id = inventario
       and (select auth.uid()) in (c.arrendador_id, c.inquilino_id)
  );
$$;

create function privado.inventario_abierto(inventario uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.inventarios
     where id = inventario
       and (aceptado_arrendador_en is null or aceptado_inquilino_en is null)
  );
$$;

revoke execute on all functions in schema privado from public, anon;
grant execute on all functions in schema privado to authenticated;

-- Cada parte solo firma su propia aceptación, con la hora del servidor,
-- y un acta aceptada por los dos ya no cambia.
create function public.validar_cambio_inventario()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  usuario uuid := (select auth.uid());
  es_arrendador boolean;
begin
  -- Sin sesión, o cuando el cambio viene de otro disparador (reinicio de aceptaciones).
  if usuario is null or pg_trigger_depth() > 1 then
    return new;
  end if;

  if old.aceptado_arrendador_en is not null and old.aceptado_inquilino_en is not null then
    raise exception 'el acta ya fue aceptada por ambas partes' using errcode = '42501';
  end if;

  es_arrendador := privado.es_arrendador_de(old.contrato_id);

  if new.aceptado_arrendador_en is distinct from old.aceptado_arrendador_en then
    if not es_arrendador then
      raise exception 'solo el arrendador acepta por el arrendador' using errcode = '42501';
    end if;
    new.aceptado_arrendador_en := case when new.aceptado_arrendador_en is not null then now() end;
  end if;

  if new.aceptado_inquilino_en is distinct from old.aceptado_inquilino_en then
    if es_arrendador then
      raise exception 'solo el inquilino acepta por el inquilino' using errcode = '42501';
    end if;
    new.aceptado_inquilino_en := case when new.aceptado_inquilino_en is not null then now() end;
  end if;

  return new;
end;
$$;

create trigger inventarios_validar_cambio
  before update on public.inventarios
  for each row execute function public.validar_cambio_inventario();

-- Si cambia un ítem, las aceptaciones anteriores dejan de valer.
create function public.reiniciar_aceptaciones_inventario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.inventarios
     set aceptado_arrendador_en = null, aceptado_inquilino_en = null
   where id = coalesce(new.inventario_id, old.inventario_id)
     and (aceptado_arrendador_en is not null or aceptado_inquilino_en is not null);
  return null;
end;
$$;

revoke execute on function public.reiniciar_aceptaciones_inventario() from public, anon, authenticated;

create trigger items_inventario_reiniciar_aceptaciones
  after insert or update or delete on public.items_inventario
  for each row execute function public.reiniciar_aceptaciones_inventario();

-- ---------------------------------------------------------------------------
-- RLS de inventarios
-- ---------------------------------------------------------------------------
alter table public.inventarios enable row level security;

create policy "inventarios: las partes leen"
  on public.inventarios for select
  to authenticated
  using (privado.es_parte_de(contrato_id));

create policy "inventarios: el arrendador crea"
  on public.inventarios for insert
  to authenticated
  with check (privado.es_arrendador_de(contrato_id));

create policy "inventarios: las partes aceptan"
  on public.inventarios for update
  to authenticated
  using (privado.es_parte_de(contrato_id))
  with check (privado.es_parte_de(contrato_id));

create policy "inventarios: el arrendador borra actas abiertas"
  on public.inventarios for delete
  to authenticated
  using (privado.es_arrendador_de(contrato_id) and privado.inventario_abierto(id));

revoke all on public.inventarios from anon;
revoke insert, update on public.inventarios from authenticated;
grant insert (contrato_id, tipo) on public.inventarios to authenticated;
grant update (aceptado_arrendador_en, aceptado_inquilino_en) on public.inventarios to authenticated;

-- ---------------------------------------------------------------------------
-- RLS de items_inventario
-- ---------------------------------------------------------------------------
alter table public.items_inventario enable row level security;

create policy "items_inventario: las partes leen"
  on public.items_inventario for select
  to authenticated
  using (privado.es_parte_de_inventario(inventario_id));

-- Cada parte agrega y corrige sus propios ítems mientras el acta esté abierta.
create policy "items_inventario: las partes agregan en actas abiertas"
  on public.items_inventario for insert
  to authenticated
  with check (
    creado_por = (select auth.uid())
    and privado.es_parte_de_inventario(inventario_id)
    and privado.inventario_abierto(inventario_id)
  );

create policy "items_inventario: el autor edita en actas abiertas"
  on public.items_inventario for update
  to authenticated
  using (creado_por = (select auth.uid()) and privado.inventario_abierto(inventario_id))
  with check (creado_por = (select auth.uid()) and privado.inventario_abierto(inventario_id));

create policy "items_inventario: el autor borra en actas abiertas"
  on public.items_inventario for delete
  to authenticated
  using (creado_por = (select auth.uid()) and privado.inventario_abierto(inventario_id));

revoke all on public.items_inventario from anon;
revoke insert, update on public.items_inventario from authenticated;
grant insert (inventario_id, ambiente, descripcion, foto_path, foto_hash, foto_tomada_en, orden)
  on public.items_inventario to authenticated;
grant update (ambiente, descripcion, foto_path, foto_hash, foto_tomada_en, orden)
  on public.items_inventario to authenticated;
