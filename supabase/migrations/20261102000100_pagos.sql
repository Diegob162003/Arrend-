-- Pagos del canon. Los estados de puntualidad (a tiempo, con atraso, vencido)
-- se calculan a partir de las fechas; aquí se guarda el estado del registro.
create type public.estado_pago as enum ('pendiente', 'reportado', 'confirmado', 'rechazado');

create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos (id) on delete cascade,
  -- Primer día del mes que se paga.
  periodo date not null check (periodo = date_trunc('month', periodo)::date),
  valor bigint not null check (valor > 0),
  fecha_limite date not null,
  fecha_pago date,
  comprobante_path text,
  -- Lo que propuso la IA al leer el comprobante: valor, fecha, referencia y confianza.
  extraido_ia jsonb check (extraido_ia is null or jsonb_typeof(extraido_ia) = 'object'),
  estado public.estado_pago not null default 'pendiente',
  confirmado_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint pagos_un_periodo_por_contrato unique (contrato_id, periodo),
  constraint pagos_confirmado_con_fecha check (
    (estado = 'confirmado') = (confirmado_en is not null)
    and (estado not in ('reportado', 'confirmado') or fecha_pago is not null)
  )
);

comment on table public.pagos is 'Un pago por periodo de cada contrato; los confirmados alimentan el historial verificado.';

create trigger pagos_actualizado_en
  before update on public.pagos
  for each row execute function public.tocar_actualizado_en();

-- Reglas que RLS no puede expresar por columna:
-- - un pago confirmado ya no cambia (es la base del historial verificado);
-- - el inquilino solo reporta: fecha, comprobante y lectura de la IA;
-- - solo el arrendador confirma o rechaza.
create function public.validar_cambio_pago()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  usuario uuid := (select auth.uid());
begin
  -- Sin sesión de usuario (migraciones, tareas del servidor): sin restricciones.
  if usuario is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.confirmado_en := case when new.estado = 'confirmado' then now() end;
    return new;
  end if;

  if old.estado = 'confirmado' then
    raise exception 'un pago confirmado no se puede modificar' using errcode = '42501';
  end if;

  if privado.es_arrendador_de(old.contrato_id) then
    new.confirmado_en := case when new.estado = 'confirmado' then now() end;
    return new;
  end if;

  -- Es el inquilino (RLS ya descartó a cualquier otra persona).
  if new.estado not in ('pendiente', 'reportado')
     or new.periodo <> old.periodo
     or new.valor <> old.valor
     or new.fecha_limite <> old.fecha_limite
     or new.confirmado_en is distinct from old.confirmado_en then
    raise exception 'el inquilino solo puede reportar el pago' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger pagos_validar_cambio
  before insert or update on public.pagos
  for each row execute function public.validar_cambio_pago();

create index pagos_contrato_id_idx on public.pagos (contrato_id);

alter table public.pagos enable row level security;

create policy "pagos: las partes leen"
  on public.pagos for select
  to authenticated
  using (privado.es_parte_de(contrato_id));

create policy "pagos: el arrendador crea"
  on public.pagos for insert
  to authenticated
  with check (privado.es_arrendador_de(contrato_id));

create policy "pagos: las partes editan"
  on public.pagos for update
  to authenticated
  using (privado.es_parte_de(contrato_id))
  with check (privado.es_parte_de(contrato_id));

create policy "pagos: el arrendador borra los no confirmados"
  on public.pagos for delete
  to authenticated
  using (privado.es_arrendador_de(contrato_id) and estado <> 'confirmado');

revoke all on public.pagos from anon;
revoke insert, update on public.pagos from authenticated;
grant insert (contrato_id, periodo, valor, fecha_limite, fecha_pago, comprobante_path, extraido_ia, estado)
  on public.pagos to authenticated;
grant update (periodo, valor, fecha_limite, fecha_pago, comprobante_path, extraido_ia, estado)
  on public.pagos to authenticated;
