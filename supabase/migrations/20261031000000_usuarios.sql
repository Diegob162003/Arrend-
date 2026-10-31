-- Perfil de cada cuenta. Una persona puede ser arrendador, inquilino o ambos.
create table public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text check (char_length(nombre) between 2 and 120),
  telefono text check (telefono ~ '^\+?[0-9]{7,15}$'),
  es_arrendador boolean not null default false,
  es_inquilino boolean not null default false,
  -- Autorización de tratamiento de datos (Ley 1581 de 2012).
  acepto_datos_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on table public.usuarios is 'Perfil de la cuenta; la fila se crea sola al registrarse.';

alter table public.usuarios enable row level security;

-- Cada quien ve y edita solo su propia fila. No hay política de insert ni delete:
-- la fila la crea el disparador y se borra en cascada con la cuenta.
create policy "usuarios: leer la propia"
  on public.usuarios for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "usuarios: editar la propia"
  on public.usuarios for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Solo estas columnas se pueden cambiar desde la app.
revoke update on public.usuarios from authenticated, anon;
grant update (nombre, telefono, es_arrendador, es_inquilino, acepto_datos_en)
  on public.usuarios to authenticated;
revoke all on public.usuarios from anon;

create function public.tocar_actualizado_en()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

create trigger usuarios_actualizado_en
  before update on public.usuarios
  for each row execute function public.tocar_actualizado_en();

create function public.crear_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.usuarios (id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.crear_usuario() from public, anon, authenticated;

create trigger al_crear_cuenta
  after insert on auth.users
  for each row execute function public.crear_usuario();
