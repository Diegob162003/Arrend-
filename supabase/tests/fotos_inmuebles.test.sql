begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

select is(
  (select public from storage.buckets where id = 'inmuebles'),
  false,
  'el bucket de fotos de inmuebles es privado'
);

-- Ana arrienda a Beto; Carla es ajena.
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-0000000000f1', 'ana.f@prueba.co'),
  ('bbbbbbbb-0000-4000-8000-0000000000f2', 'beto.f@prueba.co'),
  ('cccccccc-0000-4000-8000-0000000000f3', 'carla.f@prueba.co');

insert into public.inmuebles (id, arrendador_id, direccion, ciudad, tipo, canon_base) values
  ('a1000000-0000-4000-8000-0000000000f1', 'aaaaaaaa-0000-4000-8000-0000000000f1', 'Calle 1 # 2-3', 'Bogotá', 'casa', 1000000);

insert into public.contratos (inmueble_id, arrendador_id, inquilino_id, fecha_inicio, fecha_fin, canon, dia_pago, estado) values
  ('a1000000-0000-4000-8000-0000000000f1', 'aaaaaaaa-0000-4000-8000-0000000000f1',
   'bbbbbbbb-0000-4000-8000-0000000000f2', '2026-01-01', '2026-12-31', 1000000, 5, 'activo');

create function pg_temp.entrar(usuario uuid) returns void language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', usuario, 'role', 'authenticated')::text, true);
$$;

set local role authenticated;

-- Ana sube una foto en la carpeta de su inmueble.
select pg_temp.entrar('aaaaaaaa-0000-4000-8000-0000000000f1');
select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
     values ('inmuebles', 'aaaaaaaa-0000-4000-8000-0000000000f1/a1000000-0000-4000-8000-0000000000f1/1-sala.jpg',
             'aaaaaaaa-0000-4000-8000-0000000000f1') $$,
  'Ana sube una foto de su inmueble'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
     values ('inmuebles', 'aaaaaaaa-0000-4000-8000-0000000000f1/no-es-un-uuid/1.jpg',
             'aaaaaaaa-0000-4000-8000-0000000000f1') $$,
  '42501', null, 'una ruta mal formada se rechaza sin error de conversión'
);

-- Beto, su inquilino, la ve; no puede subir.
select pg_temp.entrar('bbbbbbbb-0000-4000-8000-0000000000f2');
select is((select count(*)::int from storage.objects where bucket_id = 'inmuebles'), 1,
  'Beto ve las fotos del inmueble que arrienda');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
     values ('inmuebles', 'aaaaaaaa-0000-4000-8000-0000000000f1/a1000000-0000-4000-8000-0000000000f1/2-intruso.jpg',
             'bbbbbbbb-0000-4000-8000-0000000000f2') $$,
  '42501', null, 'Beto no puede subir fotos al inmueble de Ana'
);

-- Carla no ve ni puede subir con su id en una carpeta del inmueble de Ana.
select pg_temp.entrar('cccccccc-0000-4000-8000-0000000000f3');
select is((select count(*)::int from storage.objects where bucket_id = 'inmuebles'), 0,
  'Carla no ve las fotos del inmueble de Ana');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
     values ('inmuebles', 'cccccccc-0000-4000-8000-0000000000f3/a1000000-0000-4000-8000-0000000000f1/3.jpg',
             'cccccccc-0000-4000-8000-0000000000f3') $$,
  '42501', null, 'Carla no puede subir fotos a un inmueble ajeno, ni en su propia carpeta'
);

select * from finish();
rollback;
