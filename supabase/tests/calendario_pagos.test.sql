begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

-- Fechas límite: el día de pago, ajustado al último día del mes y nunca antes del inicio.
select is(privado.fecha_limite_pago('2027-01-01', 5::smallint, '2026-08-01'), '2027-01-05'::date,
  'el pago vence el día de pago del mes');
select is(privado.fecha_limite_pago('2027-02-01', 31::smallint, '2026-08-01'), '2027-02-28'::date,
  'si febrero no tiene el día 31, vence el 28');
select is(privado.fecha_limite_pago('2028-02-01', 30::smallint, '2026-08-01'), '2028-02-29'::date,
  'en año bisiesto vence el 29 de febrero');
select is(privado.fecha_limite_pago('2027-04-01', 31::smallint, '2026-08-01'), '2027-04-30'::date,
  'en un mes de 30 días vence el 30');
select is(privado.fecha_limite_pago('2026-12-01', 10::smallint, '2026-12-15'), '2026-12-15'::date,
  'el primer pago no vence antes de que empiece el contrato');

select is(privado.meses_contrato('2026-08-01', '2027-07-31'), 12, 'agosto a julio son 12 meses');
select is(privado.meses_contrato('2027-01-31', '2027-02-27'), 1, 'un contrato del 31 de enero dura 1 mes');

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-0000000000d1', 'ana.d@prueba.co');
insert into public.inmuebles (id, arrendador_id, direccion, ciudad, tipo, canon_base) values
  ('a1000000-0000-4000-8000-0000000000d1', 'aaaaaaaa-0000-4000-8000-0000000000d1', 'Calle 1 # 2-3', 'Bogotá', 'casa', 1000000);
insert into public.contratos (id, inmueble_id, arrendador_id, fecha_inicio, fecha_fin, canon, dia_pago, estado) values
  ('c1000000-0000-4000-8000-0000000000d1', 'a1000000-0000-4000-8000-0000000000d1',
   'aaaaaaaa-0000-4000-8000-0000000000d1', '2026-12-15', '2027-12-14', 1000000, 31, 'borrador');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-4000-8000-0000000000d1","role":"authenticated"}', true);

select is((select count(*)::int from public.pagos), 0, 'un borrador no tiene pagos');

-- Ana sube el firmado y el contrato queda vigente.
update public.contratos set estado = 'activo' where id = 'c1000000-0000-4000-8000-0000000000d1';

select is((select count(*)::int from public.pagos), 12, 'al quedar vigente se crean 12 pagos');
select results_eq(
  $$ select periodo, fecha_limite from public.pagos order by periodo limit 3 $$,
  $$ values ('2026-12-01'::date, '2026-12-31'::date),
            ('2027-01-01'::date, '2027-01-31'::date),
            ('2027-02-01'::date, '2027-02-28'::date) $$,
  'periodos mensuales con su fecha límite'
);
select is((select max(periodo) from public.pagos), '2027-11-01'::date, 'el último periodo es noviembre');
select ok((select bool_and(valor = 1000000 and estado = 'pendiente') from public.pagos),
  'cada pago vale el canon y empieza pendiente');

-- Si el contrato vuelve a pasar a vigente, no se duplica nada.
reset role;
update public.contratos set estado = 'borrador' where id = 'c1000000-0000-4000-8000-0000000000d1';
update public.contratos set estado = 'activo' where id = 'c1000000-0000-4000-8000-0000000000d1';
select is((select count(*)::int from public.pagos where contrato_id = 'c1000000-0000-4000-8000-0000000000d1'), 12,
  'el calendario no se duplica');

-- La semilla deja el calendario completo de los contratos de prueba.
select is((select count(*)::int from public.pagos where contrato_id = '20000000-0000-4000-8000-000000000001'), 12,
  'el contrato de Beto tiene sus 12 pagos');

select * from finish();
rollback;
