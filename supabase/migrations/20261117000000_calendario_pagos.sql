-- Calendario de pagos (T11): cuando el contrato queda vigente se crea un pago
-- por cada mes del término. La puntualidad (a tiempo, con atraso, vencido) no
-- se guarda: se calcula con las fechas en src/lib/pagos.ts.

-- Meses del contrato, igual que duracionMeses en src/lib/contrato.ts:
-- 01/08/2026 → 31/07/2027 son 12 meses; 31/01/2027 → 27/02/2027 es 1.
create function privado.meses_contrato(fecha_inicio date, fecha_fin date)
returns int
language sql
immutable
set search_path = ''
as $$
  select ((extract(year from fecha_fin + 1) - extract(year from fecha_inicio)) * 12
        + extract(month from fecha_fin + 1) - extract(month from fecha_inicio))::int;
$$;

-- Fecha límite de un periodo: el día de pago de ese mes; si el mes no tiene ese
-- día, el último día del mes (así lo dice la cláusula del canon). El primer pago
-- nunca vence antes de que empiece el contrato, porque se paga por anticipado.
create function privado.fecha_limite_pago(periodo date, dia_pago smallint, fecha_inicio date)
returns date
language sql
immutable
set search_path = ''
as $$
  select greatest(
    make_date(
      extract(year from periodo)::int,
      extract(month from periodo)::int,
      least(dia_pago, extract(day from (date_trunc('month', periodo) + interval '1 month - 1 day'))::int)
    ),
    fecha_inicio
  );
$$;

revoke execute on all functions in schema privado from public, anon;
grant execute on all functions in schema privado to authenticated;

-- Un pago por mes: el contrato de 01/08/2026 a 31/07/2027 tiene 12 periodos,
-- de agosto a julio. Si un periodo ya existe, no lo toca.
create function public.generar_calendario_pagos()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.estado = 'borrador' and new.estado = 'activo' then
    insert into public.pagos (contrato_id, periodo, valor, fecha_limite)
    select new.id,
           periodo::date,
           new.canon,
           privado.fecha_limite_pago(periodo::date, new.dia_pago, new.fecha_inicio)
      from generate_series(
             date_trunc('month', new.fecha_inicio),
             date_trunc('month', new.fecha_inicio)
               + make_interval(months => privado.meses_contrato(new.fecha_inicio, new.fecha_fin) - 1),
             interval '1 month'
           ) as periodo
    on conflict (contrato_id, periodo) do nothing;
  end if;
  return new;
end;
$$;

create trigger contratos_generar_calendario
  after update of estado on public.contratos
  for each row execute function public.generar_calendario_pagos();
