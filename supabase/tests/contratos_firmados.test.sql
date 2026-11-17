begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

select is(
  (select public from storage.buckets where id = 'contratos'),
  false,
  'el bucket de contratos firmados es privado'
);

-- Ana arrienda a Beto; Carla es ajena.
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-0000000000e1', 'ana.e@prueba.co'),
  ('bbbbbbbb-0000-4000-8000-0000000000e2', 'beto.e@prueba.co'),
  ('cccccccc-0000-4000-8000-0000000000e3', 'carla.e@prueba.co');

insert into public.inmuebles (id, arrendador_id, direccion, ciudad, tipo, canon_base) values
  ('a1000000-0000-4000-8000-0000000000e1', 'aaaaaaaa-0000-4000-8000-0000000000e1', 'Calle 1 # 2-3', 'Bogotá', 'casa', 1000000);

insert into public.contratos (id, inmueble_id, arrendador_id, inquilino_id, fecha_inicio, fecha_fin, canon, dia_pago, estado) values
  ('c1000000-0000-4000-8000-0000000000e1', 'a1000000-0000-4000-8000-0000000000e1',
   'aaaaaaaa-0000-4000-8000-0000000000e1', 'bbbbbbbb-0000-4000-8000-0000000000e2',
   '2027-01-01', '2027-12-31', 1000000, 5, 'borrador');

create function pg_temp.entrar(usuario uuid) returns void language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', usuario, 'role', 'authenticated')::text, true);
$$;

set local role authenticated;

-- Carla no puede subir un firmado al contrato de Ana, ni con su id en la ruta.
select pg_temp.entrar('cccccccc-0000-4000-8000-0000000000e3');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
     values ('contratos', 'cccccccc-0000-4000-8000-0000000000e3/c1000000-0000-4000-8000-0000000000e1/firmado.pdf',
             'cccccccc-0000-4000-8000-0000000000e3') $$,
  '42501', null, 'Carla no puede subir el firmado de un contrato ajeno'
);

-- Ana sube el firmado de su borrador, con el nombre esperado.
select pg_temp.entrar('aaaaaaaa-0000-4000-8000-0000000000e1');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
     values ('contratos', 'aaaaaaaa-0000-4000-8000-0000000000e1/c1000000-0000-4000-8000-0000000000e1/otro.pdf',
             'aaaaaaaa-0000-4000-8000-0000000000e1') $$,
  '42501', null, 'el archivo debe llamarse firmado.pdf'
);
select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
     values ('contratos', 'aaaaaaaa-0000-4000-8000-0000000000e1/c1000000-0000-4000-8000-0000000000e1/firmado.pdf',
             'aaaaaaaa-0000-4000-8000-0000000000e1') $$,
  'Ana sube el contrato firmado'
);

select throws_ok(
  $$ update public.contratos set firmado_path = 'aaaaaaaa-0000-4000-8000-0000000000e1/otro/firmado.pdf'
      where id = 'c1000000-0000-4000-8000-0000000000e1' $$,
  '23514', null, 'firmado_path solo apunta a la carpeta del contrato'
);
select lives_ok(
  $$ update public.contratos
        set estado = 'activo',
            firmado_path = 'aaaaaaaa-0000-4000-8000-0000000000e1/c1000000-0000-4000-8000-0000000000e1/firmado.pdf'
      where id = 'c1000000-0000-4000-8000-0000000000e1' $$,
  'el contrato queda vigente con su firmado'
);

-- Ya vigente: ni el texto ni el archivo cambian.
select throws_ok(
  $$ update public.contratos set dia_pago = 20 where id = 'c1000000-0000-4000-8000-0000000000e1' $$,
  'P0001', null, 'los términos de un contrato firmado no cambian'
);
select is_empty(
  $$ update storage.objects set metadata = '{}' where bucket_id = 'contratos' returning 1 $$,
  'el archivo firmado no se reemplaza cuando el contrato ya está vigente'
);

-- Beto, el inquilino, lo ve; Carla no.
select pg_temp.entrar('bbbbbbbb-0000-4000-8000-0000000000e2');
select is((select count(*)::int from storage.objects where bucket_id = 'contratos'), 1,
  'Beto ve el contrato firmado');

select pg_temp.entrar('cccccccc-0000-4000-8000-0000000000e3');
select is((select count(*)::int from storage.objects where bucket_id = 'contratos'), 0,
  'Carla no ve el contrato firmado de Ana');

select * from finish();
rollback;
