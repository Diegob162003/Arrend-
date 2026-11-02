begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (id, email) values ('aaaaaaaa-0000-4000-8000-0000000000c1', 'ana.c@prueba.co');
insert into public.inmuebles (id, arrendador_id, direccion, ciudad, tipo, canon_base) values
  ('a1000000-0000-4000-8000-0000000000c1', 'aaaaaaaa-0000-4000-8000-0000000000c1', 'Calle 1 # 2-3', 'Bogotá', 'casa', 1000000);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-0000000000c1","role":"authenticated"}', true);

select lives_ok(
  $$ insert into public.contratos (inmueble_id, fecha_inicio, fecha_fin, canon, dia_pago, inquilino_nombre, clausulas_adicionales)
     values ('a1000000-0000-4000-8000-0000000000c1', '2027-01-01', '2027-12-31', 1000000, 5, 'Beto', 'Se permite una mascota.') $$,
  'un acuerdo adicional normal se guarda'
);

-- Ley 820 de 2003, art. 16: la base rechaza el depósito aunque la app falle.
select throws_ok(
  $$ insert into public.contratos (inmueble_id, fecha_inicio, fecha_fin, canon, dia_pago, clausulas_adicionales)
     values ('a1000000-0000-4000-8000-0000000000c1', '2027-01-01', '2027-12-31', 1000000, 5, 'Deja un DEPÓSITO de dos meses.') $$,
  '23514', null, 'no se puede guardar un contrato con depósito'
);
select throws_ok(
  $$ update public.contratos set clausulas_adicionales = 'Se constituye hipoteca sobre el apartamento.'
      where inmueble_id = 'a1000000-0000-4000-8000-0000000000c1' $$,
  '23514', null, 'no se puede agregar una hipoteca después'
);
select throws_ok(
  $$ update public.contratos set inquilino_correo = 'no-es-correo'
      where inmueble_id = 'a1000000-0000-4000-8000-0000000000c1' $$,
  '23514', null, 'el correo del inquilino debe ser válido'
);

select * from finish();
rollback;
