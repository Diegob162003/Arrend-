begin;
create extension if not exists pgtap with schema extensions;
select plan(46);

-- Cada tabla con RLS tiene al menos una política (si no, nadie podría leerla).
select is_empty(
  $$ select c.relname
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
        and not exists (select 1 from pg_policies p
                         where p.schemaname = 'public' and p.tablename = c.relname) $$,
  'todas las tablas de public tienen políticas'
);

-- ---------------------------------------------------------------------------
-- Datos propios de la prueba (como superusuario).
--   Ana arrienda a Beto. Carla arrienda a Dani. Nadie más se cruza.
-- ---------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'ana.t@prueba.co'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'beto.t@prueba.co'),
  ('cccccccc-0000-4000-8000-000000000003', 'carla.t@prueba.co'),
  ('dddddddd-0000-4000-8000-000000000004', 'dani.t@prueba.co');

insert into public.inmuebles (id, arrendador_id, direccion, ciudad, tipo, canon_base) values
  ('a1000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Calle 1 # 2-3', 'Bogotá', 'casa', 1000000),
  ('c1000000-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000003', 'Calle 4 # 5-6', 'Cali', 'casa', 900000);

insert into public.contratos (id, inmueble_id, arrendador_id, inquilino_id, fecha_inicio, fecha_fin, canon, dia_pago, estado) values
  ('a2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001',
   'aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002', '2026-01-01', '2026-12-31', 1000000, 5, 'activo'),
  ('c2000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001',
   'cccccccc-0000-4000-8000-000000000003', 'dddddddd-0000-4000-8000-000000000004', '2026-01-01', '2026-12-31', 900000, 1, 'activo');

insert into public.pagos (id, contrato_id, periodo, valor, fecha_limite) values
  ('a3000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', '2026-03-01', 1000000, '2026-03-05'),
  ('c3000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000001', '2026-03-01', 900000, '2026-03-01');

insert into public.inventarios (id, contrato_id, tipo) values
  ('a4000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', 'entrega'),
  ('c4000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000001', 'entrega');

insert into public.items_inventario (id, inventario_id, creado_por, ambiente, descripcion) values
  ('a5000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Sala', 'Piso en buen estado'),
  ('c5000000-0000-4000-8000-000000000001', 'c4000000-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000003', 'Sala', 'Piso en buen estado');

insert into public.arriendos_anteriores (id, inquilino_id, direccion, ciudad, desde) values
  ('b6000000-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002', 'Calle 9 # 9-9', 'Bogotá', '2024-01-01'),
  ('d6000000-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000004', 'Calle 8 # 8-8', 'Cali', '2024-01-01');

insert into public.referencias (id, arriendo_anterior_id, token_hash, vence_en, contacto_nombre, contacto, canal) values
  ('b7000000-0000-4000-8000-000000000001', 'b6000000-0000-4000-8000-000000000001', repeat('b', 64), now() + interval '7 days', 'Marta', '+573001112233', 'whatsapp'),
  ('d7000000-0000-4000-8000-000000000001', 'd6000000-0000-4000-8000-000000000001', repeat('d', 64), now() + interval '7 days', 'Luis', '+573001114455', 'sms');

insert into public.perfiles_compartidos (id, inquilino_id, token_hash, destinatario, vence_en) values
  ('b8000000-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002', repeat('e', 64), 'Arrendador X', now() + interval '7 days'),
  ('d8000000-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000004', repeat('f', 64), 'Arrendador Y', now() + interval '7 days');

insert into public.accesos_perfil (perfil_compartido_id) values
  ('b8000000-0000-4000-8000-000000000001'),
  ('d8000000-0000-4000-8000-000000000001');

-- Ayuda: entrar como una cuenta.
create function pg_temp.entrar(usuario uuid) returns void language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', usuario, 'role', 'authenticated')::text, true);
$$;

-- ---------------------------------------------------------------------------
-- Carla (arrendadora ajena) no ve ni toca nada de Ana ni de Beto.
-- ---------------------------------------------------------------------------
set local role authenticated;
select pg_temp.entrar('cccccccc-0000-4000-8000-000000000003');

select results_eq('select id from public.inmuebles', $$ values ('c1000000-0000-4000-8000-000000000001'::uuid) $$,
  'Carla solo ve su inmueble');
select results_eq('select id from public.contratos', $$ values ('c2000000-0000-4000-8000-000000000001'::uuid) $$,
  'Carla solo ve su contrato');
select results_eq('select id from public.pagos', $$ values ('c3000000-0000-4000-8000-000000000001'::uuid) $$,
  'Carla solo ve los pagos de su contrato');
select results_eq('select id from public.inventarios', $$ values ('c4000000-0000-4000-8000-000000000001'::uuid) $$,
  'Carla solo ve su inventario');
select results_eq('select id from public.items_inventario', $$ values ('c5000000-0000-4000-8000-000000000001'::uuid) $$,
  'Carla solo ve los ítems de su inventario');
select is_empty('select id from public.arriendos_anteriores', 'Carla no ve arriendos anteriores de nadie');
select is_empty('select id from public.referencias', 'Carla no ve referencias de nadie');
select is_empty('select id from public.perfiles_compartidos', 'Carla no ve perfiles compartidos de nadie');
select is_empty('select id from public.accesos_perfil', 'Carla no ve accesos de nadie');

select is_empty(
  $$ update public.inmuebles set canon_base = 1 where id = 'a1000000-0000-4000-8000-000000000001' returning id $$,
  'Carla no puede editar el inmueble de Ana');
select is_empty(
  $$ update public.contratos set canon = 1 where id = 'a2000000-0000-4000-8000-000000000001' returning id $$,
  'Carla no puede editar el contrato de Ana');
select is_empty(
  $$ update public.pagos set estado = 'confirmado', fecha_pago = '2026-03-02'
      where id = 'a3000000-0000-4000-8000-000000000001' returning id $$,
  'Carla no puede confirmar pagos de Ana');
select is_empty(
  $$ delete from public.items_inventario where id = 'a5000000-0000-4000-8000-000000000001' returning id $$,
  'Carla no puede borrar ítems del inventario de Ana');
select is_empty(
  $$ delete from public.inmuebles where id = 'a1000000-0000-4000-8000-000000000001' returning id $$,
  'Carla no puede borrar el inmueble de Ana');

select throws_ok(
  $$ insert into public.contratos (inmueble_id, fecha_inicio, fecha_fin, canon, dia_pago)
     values ('a1000000-0000-4000-8000-000000000001', '2027-01-01', '2027-12-31', 1, 1) $$,
  '42501', null, 'Carla no puede crear un contrato sobre el inmueble de Ana');
select throws_ok(
  $$ insert into public.pagos (contrato_id, periodo, valor, fecha_limite)
     values ('a2000000-0000-4000-8000-000000000001', '2026-04-01', 1, '2026-04-05') $$,
  '42501', null, 'Carla no puede crear pagos en el contrato de Ana');
select throws_ok(
  $$ insert into public.items_inventario (inventario_id, ambiente, descripcion)
     values ('a4000000-0000-4000-8000-000000000001', 'Patio', 'Intruso') $$,
  '42501', null, 'Carla no puede agregar ítems al inventario de Ana');
select throws_ok(
  $$ insert into public.referencias (arriendo_anterior_id, token_hash, vence_en, contacto_nombre, contacto, canal)
     values ('b6000000-0000-4000-8000-000000000001', repeat('0', 64), now() + interval '1 day', 'Falsa', '+573000000000', 'sms') $$,
  '42501', null, 'Carla no puede pedir referencias a nombre de Beto');

-- ---------------------------------------------------------------------------
-- Beto (inquilino de Ana) ve su contrato, pero no lo administra.
-- ---------------------------------------------------------------------------
select pg_temp.entrar('bbbbbbbb-0000-4000-8000-000000000002');

select results_eq('select id from public.inmuebles', $$ values ('a1000000-0000-4000-8000-000000000001'::uuid) $$,
  'Beto ve el inmueble que arrienda y ningún otro');
select results_eq('select id from public.contratos', $$ values ('a2000000-0000-4000-8000-000000000001'::uuid) $$,
  'Beto ve solo su contrato');
select results_eq('select id from public.pagos', $$ values ('a3000000-0000-4000-8000-000000000001'::uuid) $$,
  'Beto ve solo sus pagos');
select results_eq('select id from public.perfiles_compartidos', $$ values ('b8000000-0000-4000-8000-000000000001'::uuid) $$,
  'Beto ve solo sus perfiles compartidos');
select is((select count(*)::int from public.accesos_perfil), 1, 'Beto ve solo los accesos a su perfil');

select is_empty(
  $$ update public.contratos set canon = 1 where id = 'a2000000-0000-4000-8000-000000000001' returning id $$,
  'Beto no puede editar su contrato');
select throws_ok(
  $$ insert into public.pagos (contrato_id, periodo, valor, fecha_limite)
     values ('a2000000-0000-4000-8000-000000000001', '2026-04-01', 1, '2026-04-05') $$,
  '42501', null, 'Beto no puede crear pagos');
select throws_ok(
  $$ update public.pagos set valor = 1 where id = 'a3000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'Beto no puede cambiar el valor de un pago');
select throws_ok(
  $$ update public.pagos set estado = 'confirmado', fecha_pago = '2026-03-04'
      where id = 'a3000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'Beto no puede confirmar su propio pago');
select lives_ok(
  $$ update public.pagos set estado = 'reportado', fecha_pago = '2026-03-04',
            extraido_ia = '{"valor": 1000000, "confianza": 0.9}'
      where id = 'a3000000-0000-4000-8000-000000000001' $$,
  'Beto puede reportar su pago con comprobante');
select throws_ok(
  $$ update public.inventarios set aceptado_arrendador_en = now()
      where id = 'a4000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'Beto no puede aceptar el acta por Ana');
select throws_ok(
  $$ insert into public.arriendos_anteriores (direccion, ciudad, desde, contrato_id)
     values ('Calle 4 # 5-6', 'Cali', '2025-01-01', 'c2000000-0000-4000-8000-000000000001') $$,
  '42501', null, 'Beto no puede presentar como suyo un contrato ajeno');
select lives_ok(
  $$ update public.referencias set oculta = true where id = 'b7000000-0000-4000-8000-000000000001' $$,
  'Beto puede ocultar su referencia');
select throws_ok(
  $$ update public.referencias set pagaba_a_tiempo = true where id = 'b7000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'Beto no puede escribir lo que responde el referente');
select throws_ok(
  $$ insert into public.accesos_perfil (perfil_compartido_id) values ('b8000000-0000-4000-8000-000000000001') $$,
  '42501', null, 'Beto no puede inventar accesos a su perfil');

-- ---------------------------------------------------------------------------
-- Ana (arrendadora) administra su contrato, pero no el perfil de Beto.
-- ---------------------------------------------------------------------------
select pg_temp.entrar('aaaaaaaa-0000-4000-8000-000000000001');

select is_empty('select id from public.arriendos_anteriores', 'Ana no ve los arriendos anteriores de Beto');
select is_empty('select id from public.referencias', 'Ana no ve las referencias de Beto');
select throws_ok(
  $$ update public.contratos set inquilino_id = 'dddddddd-0000-4000-8000-000000000004'
      where id = 'a2000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'Ana no puede asignar un inquilino a mano');
select lives_ok(
  $$ update public.pagos set estado = 'confirmado' where id = 'a3000000-0000-4000-8000-000000000001' $$,
  'Ana confirma el pago reportado');
select throws_ok(
  $$ update public.pagos set valor = 1 where id = 'a3000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'un pago confirmado ya no se puede cambiar');
select is_empty(
  $$ delete from public.pagos where id = 'a3000000-0000-4000-8000-000000000001' returning id $$,
  'un pago confirmado no se puede borrar');

-- Ambas partes aceptan el acta y queda bloqueada.
update public.inventarios set aceptado_arrendador_en = now() where id = 'a4000000-0000-4000-8000-000000000001';
select pg_temp.entrar('bbbbbbbb-0000-4000-8000-000000000002');
update public.inventarios set aceptado_inquilino_en = now() where id = 'a4000000-0000-4000-8000-000000000001';
select pg_temp.entrar('aaaaaaaa-0000-4000-8000-000000000001');

select is_empty(
  $$ update public.items_inventario set descripcion = 'Cambiado después' where id = 'a5000000-0000-4000-8000-000000000001' returning id $$,
  'nadie edita los ítems de un acta aceptada por ambos');
select throws_ok(
  $$ update public.inventarios set aceptado_arrendador_en = null where id = 'a4000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'un acta aceptada por ambos no se reabre');

-- ---------------------------------------------------------------------------
-- Un visitante sin sesión no lee ninguna tabla.
-- ---------------------------------------------------------------------------
reset role;
set local role anon;
select throws_ok('select * from public.contratos', '42501', null, 'anon no lee contratos');
select throws_ok('select * from public.referencias', '42501', null, 'anon no lee referencias');
select throws_ok('select * from public.perfiles_compartidos', '42501', null, 'anon no lee perfiles compartidos');

reset role;
select is(
  (select canon from public.contratos where id = 'a2000000-0000-4000-8000-000000000001'),
  1000000::bigint,
  'el contrato de Ana sigue intacto'
);

select * from finish();
rollback;
