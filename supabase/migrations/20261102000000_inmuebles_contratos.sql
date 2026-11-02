-- Funciones de apoyo para las políticas RLS. Viven en un esquema que la API no
-- expone y son security definer para consultar otras tablas sin caer en
-- recursión de políticas. Todas responden solo por el usuario de la sesión.
create schema privado;
grant usage on schema privado to authenticated;

-- ---------------------------------------------------------------------------
-- Inmuebles
-- ---------------------------------------------------------------------------
create type public.tipo_inmueble as enum (
  'apartamento', 'apartaestudio', 'casa', 'habitacion', 'local', 'otro'
);

create table public.inmuebles (
  id uuid primary key default gen_random_uuid(),
  arrendador_id uuid not null default auth.uid()
    references public.usuarios (id) on delete cascade,
  direccion text not null check (char_length(direccion) between 5 and 200),
  ciudad text not null check (char_length(ciudad) between 2 and 80),
  tipo public.tipo_inmueble not null,
  -- Valores en pesos colombianos, sin decimales.
  canon_base bigint not null check (canon_base > 0),
  notas text check (char_length(notas) <= 1000),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on table public.inmuebles is 'Inmuebles que un arrendador tiene para arrendar.';

create index inmuebles_arrendador_id_idx on public.inmuebles (arrendador_id);

create trigger inmuebles_actualizado_en
  before update on public.inmuebles
  for each row execute function public.tocar_actualizado_en();

-- ---------------------------------------------------------------------------
-- Contratos
-- ---------------------------------------------------------------------------
-- Garantías permitidas en vivienda urbana: la Ley 820 de 2003 (art. 16) prohíbe
-- los depósitos en dinero, así que no existe la opción "depósito".
create type public.garantia_tipo as enum ('codeudor', 'poliza', 'servicios_publicos');

create type public.estado_contrato as enum ('borrador', 'activo', 'terminado', 'cancelado');

create table public.contratos (
  id uuid primary key default gen_random_uuid(),
  inmueble_id uuid not null references public.inmuebles (id) on delete restrict,
  arrendador_id uuid not null default auth.uid()
    references public.usuarios (id) on delete restrict,
  -- Se llena al aceptar la invitación; la app no lo puede escribir directamente.
  inquilino_id uuid references public.usuarios (id) on delete set null,
  fecha_inicio date not null,
  fecha_fin date not null,
  canon bigint not null check (canon > 0),
  dia_pago smallint not null check (dia_pago between 1 and 31),
  -- Null = sin garantía.
  garantia_tipo public.garantia_tipo,
  estado public.estado_contrato not null default 'borrador',
  pdf_path text,
  firmado_path text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint contratos_fechas check (fecha_fin > fecha_inicio),
  constraint contratos_partes_distintas check (inquilino_id is distinct from arrendador_id)
);

comment on table public.contratos is 'Contrato de arrendamiento: el centro del modelo.';

create index contratos_inmueble_id_idx on public.contratos (inmueble_id);
create index contratos_arrendador_id_idx on public.contratos (arrendador_id);
create index contratos_inquilino_id_idx on public.contratos (inquilino_id);

create trigger contratos_actualizado_en
  before update on public.contratos
  for each row execute function public.tocar_actualizado_en();

-- ---------------------------------------------------------------------------
-- Funciones de apoyo
-- ---------------------------------------------------------------------------
create function privado.es_arrendador_de(contrato uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.contratos
     where id = contrato and arrendador_id = (select auth.uid())
  );
$$;

create function privado.es_inquilino_de(contrato uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.contratos
     where id = contrato and inquilino_id = (select auth.uid())
  );
$$;

create function privado.es_parte_de(contrato uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.contratos
     where id = contrato
       and (select auth.uid()) in (arrendador_id, inquilino_id)
  );
$$;

create function privado.es_inquilino_de_inmueble(inmueble uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.contratos
     where inmueble_id = inmueble and inquilino_id = (select auth.uid())
  );
$$;

revoke execute on all functions in schema privado from public, anon;
grant execute on all functions in schema privado to authenticated;

-- ---------------------------------------------------------------------------
-- RLS de inmuebles
-- ---------------------------------------------------------------------------
alter table public.inmuebles enable row level security;

create policy "inmuebles: el arrendador y sus inquilinos leen"
  on public.inmuebles for select
  to authenticated
  using (
    arrendador_id = (select auth.uid())
    or privado.es_inquilino_de_inmueble(id)
  );

create policy "inmuebles: el arrendador crea los suyos"
  on public.inmuebles for insert
  to authenticated
  with check (arrendador_id = (select auth.uid()));

create policy "inmuebles: el arrendador edita los suyos"
  on public.inmuebles for update
  to authenticated
  using (arrendador_id = (select auth.uid()))
  with check (arrendador_id = (select auth.uid()));

create policy "inmuebles: el arrendador borra los suyos"
  on public.inmuebles for delete
  to authenticated
  using (arrendador_id = (select auth.uid()));

revoke all on public.inmuebles from anon;
revoke insert, update on public.inmuebles from authenticated;
grant insert (direccion, ciudad, tipo, canon_base, notas) on public.inmuebles to authenticated;
grant update (direccion, ciudad, tipo, canon_base, notas) on public.inmuebles to authenticated;

-- ---------------------------------------------------------------------------
-- RLS de contratos
-- ---------------------------------------------------------------------------
alter table public.contratos enable row level security;

create policy "contratos: las partes leen"
  on public.contratos for select
  to authenticated
  using ((select auth.uid()) in (arrendador_id, inquilino_id));

-- Solo sobre un inmueble propio.
create policy "contratos: el arrendador crea"
  on public.contratos for insert
  to authenticated
  with check (
    arrendador_id = (select auth.uid())
    and exists (
      select 1 from public.inmuebles i
       where i.id = inmueble_id and i.arrendador_id = (select auth.uid())
    )
  );

create policy "contratos: el arrendador edita"
  on public.contratos for update
  to authenticated
  using (arrendador_id = (select auth.uid()))
  with check (
    arrendador_id = (select auth.uid())
    and exists (
      select 1 from public.inmuebles i
       where i.id = inmueble_id and i.arrendador_id = (select auth.uid())
    )
  );

create policy "contratos: el arrendador borra borradores"
  on public.contratos for delete
  to authenticated
  using (arrendador_id = (select auth.uid()) and estado = 'borrador');

revoke all on public.contratos from anon;
revoke insert, update on public.contratos from authenticated;
grant insert (inmueble_id, fecha_inicio, fecha_fin, canon, dia_pago, garantia_tipo, estado, pdf_path, firmado_path)
  on public.contratos to authenticated;
grant update (inmueble_id, fecha_inicio, fecha_fin, canon, dia_pago, garantia_tipo, estado, pdf_path, firmado_path)
  on public.contratos to authenticated;
