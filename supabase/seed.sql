-- Datos de prueba para la base local (se cargan con `npm run db:reset`).
-- Las cuentas entran con el código que llega a http://127.0.0.1:54324.
--   ana@prueba.co    arrendadora, dueña del apartamento de Chapinero
--   beto@prueba.co   inquilino de Ana, con un arriendo anterior y una referencia
--   carla@prueba.co  arrendadora con su propio inmueble
--   dani@prueba.co   inquilina de Carla

insert into auth.users (
  instance_id, id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email, now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(),
  '', '', '', ''
from (values
  ('a0000000-0000-4000-8000-000000000001'::uuid, 'ana@prueba.co'),
  ('b0000000-0000-4000-8000-000000000002'::uuid, 'beto@prueba.co'),
  ('c0000000-0000-4000-8000-000000000003'::uuid, 'carla@prueba.co'),
  ('d0000000-0000-4000-8000-000000000004'::uuid, 'dani@prueba.co')
) as cuentas (id, email);

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select id::text, id, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
       'email', now(), now(), now()
  from auth.users
 where email like '%@prueba.co';

-- El disparador ya creó las filas de usuarios; se completan los perfiles.
update public.usuarios u
   set nombre = p.nombre, telefono = p.telefono,
       es_arrendador = p.arrendador, es_inquilino = p.inquilino,
       acepto_datos_en = now()
  from (values
    ('a0000000-0000-4000-8000-000000000001'::uuid, 'Ana Rojas', '+573001110001', true, false),
    ('b0000000-0000-4000-8000-000000000002'::uuid, 'Beto Gómez', '+573001110002', false, true),
    ('c0000000-0000-4000-8000-000000000003'::uuid, 'Carla Pérez', '+573001110003', true, false),
    ('d0000000-0000-4000-8000-000000000004'::uuid, 'Dani Torres', '+573001110004', false, true)
  ) as p (id, nombre, telefono, arrendador, inquilino)
 where u.id = p.id;

insert into public.inmuebles (id, arrendador_id, direccion, ciudad, tipo, canon_base) values
  ('10000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'Calle 57 # 9-30, apto 402', 'Bogotá', 'apartamento', 1800000),
  ('10000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001',
   'Carrera 7 # 12-45', 'Soacha', 'casa', 1200000),
  ('10000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000003',
   'Calle 10 # 40-20, apto 301', 'Medellín', 'apartaestudio', 1300000);

insert into public.contratos
  (id, inmueble_id, arrendador_id, inquilino_id, fecha_inicio, fecha_fin, canon, dia_pago, garantia_tipo, estado)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
   'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002',
   '2026-08-01', '2027-07-31', 1800000, 5, 'codeudor', 'activo'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000003',
   'c0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000004',
   '2026-09-01', '2027-08-31', 1300000, 1, 'poliza', 'activo'),
  -- Borrador de Ana todavía sin inquilino.
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002',
   'a0000000-0000-4000-8000-000000000001', null,
   '2026-12-01', '2027-11-30', 1200000, 10, 'servicios_publicos', 'borrador');

insert into public.pagos
  (contrato_id, periodo, valor, fecha_limite, fecha_pago, estado, confirmado_en, extraido_ia)
values
  ('20000000-0000-4000-8000-000000000001', '2026-08-01', 1800000, '2026-08-05', '2026-08-04', 'confirmado', '2026-08-04 19:00-05', null),
  ('20000000-0000-4000-8000-000000000001', '2026-09-01', 1800000, '2026-09-05', '2026-09-08', 'confirmado', '2026-09-08 20:00-05', null),
  ('20000000-0000-4000-8000-000000000001', '2026-10-01', 1800000, '2026-10-05', '2026-10-03', 'reportado', null,
   '{"valor": 1800000, "fecha": "2026-10-03", "referencia": "M123456", "confianza": 0.94}'),
  ('20000000-0000-4000-8000-000000000001', '2026-11-01', 1800000, '2026-11-05', null, 'pendiente', null, null),
  ('20000000-0000-4000-8000-000000000002', '2026-09-01', 1300000, '2026-09-01', '2026-09-01', 'confirmado', '2026-09-01 18:00-05', null),
  ('20000000-0000-4000-8000-000000000002', '2026-10-01', 1300000, '2026-10-01', null, 'pendiente', null, null);

insert into public.inventarios (id, contrato_id, tipo, aceptado_arrendador_en, aceptado_inquilino_en) values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'entrega',
   '2026-08-01 10:00-05', '2026-08-01 10:30-05');

insert into public.items_inventario (inventario_id, creado_por, ambiente, descripcion, orden) values
  ('30000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Sala', 'Piso laminado sin rayones, dos ventanas con cortina', 1),
  ('30000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Cocina', 'Estufa de cuatro puestos funcionando, mesón sin manchas', 2),
  ('30000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', 'Baño', 'Grieta pequeña en la baldosa junto a la ducha', 3);

-- El disparador de ítems reinició las aceptaciones; el acta de prueba queda aceptada.
update public.inventarios
   set aceptado_arrendador_en = '2026-08-01 10:00-05', aceptado_inquilino_en = '2026-08-01 10:30-05'
 where id = '30000000-0000-4000-8000-000000000001';

insert into public.arriendos_anteriores (id, inquilino_id, direccion, ciudad, desde, hasta) values
  ('40000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002',
   'Calle 45 # 20-10, apto 201', 'Bogotá', '2023-02-01', '2026-07-31');

insert into public.referencias
  (arriendo_anterior_id, token_hash, vence_en, contacto_nombre, contacto, canal,
   pagaba_a_tiempo, entrego_buen_estado, volveria_a_arrendar, comentario,
   acepta_contacto, canal_contacto, autorizo_datos_en, respondida_en, nivel)
values
  ('40000000-0000-4000-8000-000000000001', encode(sha256('token-de-prueba-1'), 'hex'), now() + interval '7 days',
   'Marta Silva', '+573005550001', 'whatsapp',
   true, true, true, 'Siempre pagó a tiempo y entregó el apartamento impecable.',
   true, 'whatsapp', now(), now(), 'declarada');

insert into public.perfiles_compartidos (id, inquilino_id, token_hash, destinatario, vence_en) values
  ('50000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002',
   encode(sha256('token-de-prueba-2'), 'hex'), 'Arrendador del apto en Cedritos', now() + interval '7 days');
