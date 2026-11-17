begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

-- Ninguna tabla pública puede quedar sin RLS.
select is_empty(
  $$ select c.relname
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity $$,
  'todas las tablas de public tienen RLS activado'
);

-- Dos cuentas de prueba; el disparador les crea su fila en usuarios.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'ana.u@prueba.co'),
  ('22222222-2222-2222-2222-222222222222', 'beto.u@prueba.co');

select is(
  (select count(*)::int from public.usuarios
    where id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')),
  2,
  'el disparador crea la fila de usuarios al registrarse'
);

-- Ana inicia sesión.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select results_eq(
  'select id from public.usuarios',
  $$ values ('11111111-1111-1111-1111-111111111111'::uuid) $$,
  'Ana solo ve su propia fila'
);

update public.usuarios set nombre = 'Ana' where id = '11111111-1111-1111-1111-111111111111';
select is(
  (select nombre from public.usuarios where id = '11111111-1111-1111-1111-111111111111'),
  'Ana',
  'Ana puede editar su nombre'
);

-- Intenta cambiar la fila de Beto: RLS la oculta y no se modifica nada.
update public.usuarios set nombre = 'Hackeado' where id = '22222222-2222-2222-2222-222222222222';

select throws_ok(
  $$ update public.usuarios set creado_en = now() where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501',
  null,
  'no se pueden editar columnas protegidas'
);

select throws_ok(
  $$ insert into public.usuarios (id) values (gen_random_uuid()) $$,
  '42501',
  null,
  'no se pueden crear filas desde la app'
);

-- Un visitante sin sesión no ve nada.
reset role;
set local role anon;
select throws_ok(
  'select * from public.usuarios',
  '42501',
  null,
  'un visitante sin sesión no puede leer usuarios'
);

reset role;
select is(
  (select nombre from public.usuarios where id = '22222222-2222-2222-2222-222222222222'),
  null,
  'la fila de Beto sigue intacta'
);

select * from finish();
rollback;
