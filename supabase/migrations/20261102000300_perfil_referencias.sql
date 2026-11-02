-- Perfil del inquilino: arriendos anteriores, referencias y perfiles compartidos.
-- El perfil es del inquilino: solo él lo ve y decide con quién lo comparte.
-- Los referentes y quienes abren un perfil compartido no tienen cuenta; esas
-- lecturas y escrituras las hace el servidor, después de validar el token.

-- ---------------------------------------------------------------------------
-- Arriendos anteriores
-- ---------------------------------------------------------------------------
create table public.arriendos_anteriores (
  id uuid primary key default gen_random_uuid(),
  inquilino_id uuid not null default auth.uid()
    references public.usuarios (id) on delete cascade,
  direccion text not null check (char_length(direccion) between 5 and 200),
  ciudad text not null check (char_length(ciudad) between 2 and 80),
  desde date not null,
  hasta date,
  -- Lleno cuando el arriendo se gestionó en la plataforma: la referencia queda verificada.
  contrato_id uuid references public.contratos (id) on delete set null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint arriendos_anteriores_fechas check (hasta is null or hasta > desde)
);

comment on table public.arriendos_anteriores is 'Arriendos que el inquilino declara en su perfil.';

create index arriendos_anteriores_inquilino_id_idx on public.arriendos_anteriores (inquilino_id);
create index arriendos_anteriores_contrato_id_idx on public.arriendos_anteriores (contrato_id);

create trigger arriendos_anteriores_actualizado_en
  before update on public.arriendos_anteriores
  for each row execute function public.tocar_actualizado_en();

-- ---------------------------------------------------------------------------
-- Referencias
-- ---------------------------------------------------------------------------
create type public.canal_referencia as enum ('whatsapp', 'sms', 'correo');

-- Declarada: contacto verificado. Con soporte: adjuntó contrato o recibo.
-- Verificada: el arriendo se gestionó dentro de la plataforma.
create type public.nivel_referencia as enum ('declarada', 'con_soporte', 'verificada');

create type public.canal_contacto as enum ('telefono', 'whatsapp', 'correo');

create table public.referencias (
  id uuid primary key default gen_random_uuid(),
  arriendo_anterior_id uuid not null
    references public.arriendos_anteriores (id) on delete cascade,
  -- SHA-256 del token del enlace; el token en claro nunca se guarda.
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  vence_en timestamptz not null,
  contacto_nombre text not null check (char_length(contacto_nombre) between 2 and 120),
  contacto text not null check (char_length(contacto) between 5 and 160),
  canal public.canal_referencia not null,
  -- Lo que llena el referente (solo el servidor escribe estas columnas).
  pagaba_a_tiempo boolean,
  entrego_buen_estado boolean,
  volveria_a_arrendar boolean,
  comentario text check (char_length(comentario) <= 1000),
  soporte_path text,
  acepta_contacto boolean,
  canal_contacto public.canal_contacto,
  autorizo_datos_en timestamptz,
  respondida_en timestamptz,
  nivel public.nivel_referencia,
  -- El inquilino puede ocultar una referencia, pero no editar lo que dijo el referente.
  oculta boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint referencias_respuesta_completa check (
    respondida_en is null
    or (pagaba_a_tiempo is not null and entrego_buen_estado is not null
        and volveria_a_arrendar is not null and autorizo_datos_en is not null
        and nivel is not null)
  )
);

comment on table public.referencias is 'Solicitud de referencia a un arrendador anterior y su respuesta.';

create index referencias_arriendo_anterior_id_idx on public.referencias (arriendo_anterior_id);

create trigger referencias_actualizado_en
  before update on public.referencias
  for each row execute function public.tocar_actualizado_en();

-- ---------------------------------------------------------------------------
-- Perfiles compartidos y su registro de aperturas
-- ---------------------------------------------------------------------------
create table public.perfiles_compartidos (
  id uuid primary key default gen_random_uuid(),
  inquilino_id uuid not null default auth.uid()
    references public.usuarios (id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  destinatario text not null check (char_length(destinatario) between 2 and 120),
  vence_en timestamptz not null,
  abierto_en timestamptz,
  revocado_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint perfiles_compartidos_vencimiento check (vence_en > creado_en)
);

comment on table public.perfiles_compartidos is 'Enlace privado y con vencimiento al perfil del inquilino.';

create index perfiles_compartidos_inquilino_id_idx on public.perfiles_compartidos (inquilino_id);

create trigger perfiles_compartidos_actualizado_en
  before update on public.perfiles_compartidos
  for each row execute function public.tocar_actualizado_en();

create table public.accesos_perfil (
  id bigint generated always as identity primary key,
  perfil_compartido_id uuid not null
    references public.perfiles_compartidos (id) on delete cascade,
  abierto_en timestamptz not null default now(),
  -- Hash de la IP (no la IP en claro) y navegador, para detectar reenvíos.
  ip_hash text check (ip_hash ~ '^[0-9a-f]{64}$'),
  user_agent text check (char_length(user_agent) <= 400)
);

comment on table public.accesos_perfil is 'Auditoría: cada vez que alguien abre un perfil compartido.';

create index accesos_perfil_perfil_compartido_id_idx on public.accesos_perfil (perfil_compartido_id);

-- ---------------------------------------------------------------------------
-- Funciones de apoyo
-- ---------------------------------------------------------------------------
create function privado.es_dueno_de_arriendo(arriendo uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.arriendos_anteriores
     where id = arriendo and inquilino_id = (select auth.uid())
  );
$$;

create function privado.es_dueno_de_perfil(perfil uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles_compartidos
     where id = perfil and inquilino_id = (select auth.uid())
  );
$$;

revoke execute on all functions in schema privado from public, anon;
grant execute on all functions in schema privado to authenticated;

-- ---------------------------------------------------------------------------
-- RLS de arriendos_anteriores
-- ---------------------------------------------------------------------------
alter table public.arriendos_anteriores enable row level security;

create policy "arriendos_anteriores: el inquilino lee los suyos"
  on public.arriendos_anteriores for select
  to authenticated
  using (inquilino_id = (select auth.uid()));

-- Solo puede enlazar contratos en los que fue el inquilino.
create policy "arriendos_anteriores: el inquilino crea los suyos"
  on public.arriendos_anteriores for insert
  to authenticated
  with check (
    inquilino_id = (select auth.uid())
    and (contrato_id is null or privado.es_inquilino_de(contrato_id))
  );

create policy "arriendos_anteriores: el inquilino edita los suyos"
  on public.arriendos_anteriores for update
  to authenticated
  using (inquilino_id = (select auth.uid()))
  with check (
    inquilino_id = (select auth.uid())
    and (contrato_id is null or privado.es_inquilino_de(contrato_id))
  );

create policy "arriendos_anteriores: el inquilino borra los suyos"
  on public.arriendos_anteriores for delete
  to authenticated
  using (inquilino_id = (select auth.uid()));

revoke all on public.arriendos_anteriores from anon;
revoke insert, update on public.arriendos_anteriores from authenticated;
grant insert (direccion, ciudad, desde, hasta, contrato_id) on public.arriendos_anteriores to authenticated;
grant update (direccion, ciudad, desde, hasta, contrato_id) on public.arriendos_anteriores to authenticated;

-- ---------------------------------------------------------------------------
-- RLS de referencias
-- ---------------------------------------------------------------------------
alter table public.referencias enable row level security;

create policy "referencias: el inquilino lee las suyas"
  on public.referencias for select
  to authenticated
  using (privado.es_dueno_de_arriendo(arriendo_anterior_id));

create policy "referencias: el inquilino solicita"
  on public.referencias for insert
  to authenticated
  with check (privado.es_dueno_de_arriendo(arriendo_anterior_id));

create policy "referencias: el inquilino oculta"
  on public.referencias for update
  to authenticated
  using (privado.es_dueno_de_arriendo(arriendo_anterior_id))
  with check (privado.es_dueno_de_arriendo(arriendo_anterior_id));

create policy "referencias: el inquilino borra las no respondidas"
  on public.referencias for delete
  to authenticated
  using (privado.es_dueno_de_arriendo(arriendo_anterior_id) and respondida_en is null);

revoke all on public.referencias from anon;
revoke insert, update on public.referencias from authenticated;
grant insert (arriendo_anterior_id, token_hash, vence_en, contacto_nombre, contacto, canal)
  on public.referencias to authenticated;
grant update (oculta) on public.referencias to authenticated;

-- ---------------------------------------------------------------------------
-- RLS de perfiles_compartidos
-- ---------------------------------------------------------------------------
alter table public.perfiles_compartidos enable row level security;

create policy "perfiles_compartidos: el inquilino lee los suyos"
  on public.perfiles_compartidos for select
  to authenticated
  using (inquilino_id = (select auth.uid()));

create policy "perfiles_compartidos: el inquilino crea los suyos"
  on public.perfiles_compartidos for insert
  to authenticated
  with check (inquilino_id = (select auth.uid()));

create policy "perfiles_compartidos: el inquilino edita los suyos"
  on public.perfiles_compartidos for update
  to authenticated
  using (inquilino_id = (select auth.uid()))
  with check (inquilino_id = (select auth.uid()));

create policy "perfiles_compartidos: el inquilino borra los suyos"
  on public.perfiles_compartidos for delete
  to authenticated
  using (inquilino_id = (select auth.uid()));

revoke all on public.perfiles_compartidos from anon;
revoke insert, update on public.perfiles_compartidos from authenticated;
grant insert (token_hash, destinatario, vence_en) on public.perfiles_compartidos to authenticated;
grant update (destinatario, vence_en, revocado_en) on public.perfiles_compartidos to authenticated;

-- ---------------------------------------------------------------------------
-- RLS de accesos_perfil: solo lectura para el dueño; escribe el servidor.
-- ---------------------------------------------------------------------------
alter table public.accesos_perfil enable row level security;

create policy "accesos_perfil: el inquilino lee los de sus perfiles"
  on public.accesos_perfil for select
  to authenticated
  using (privado.es_dueno_de_perfil(perfil_compartido_id));

revoke all on public.accesos_perfil from anon;
revoke insert, update, delete on public.accesos_perfil from authenticated;
