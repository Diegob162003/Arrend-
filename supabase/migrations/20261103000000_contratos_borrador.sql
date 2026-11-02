-- Datos que el arrendador llena mientras el contrato es borrador: a quién
-- invitará como inquilino (T10) y las cláusulas propias que quiera agregar.
alter table public.contratos
  add column inquilino_nombre text check (char_length(inquilino_nombre) between 2 and 120),
  add column inquilino_correo text check (inquilino_correo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  add column clausulas_adicionales text check (char_length(clausulas_adicionales) <= 2000);

-- Ley 820 de 2003, art. 16: en vivienda urbana no se pueden exigir depósitos en
-- dinero ni cauciones reales. La app lo explica; la base lo impide igual.
alter table public.contratos
  add constraint contratos_sin_deposito check (
    clausulas_adicionales is null
    or clausulas_adicionales !~* '(dep[oó]sito|cauci[oó]n real|hipoteca|prenda)'
  );

grant insert (inquilino_nombre, inquilino_correo, clausulas_adicionales) on public.contratos to authenticated;
grant update (inquilino_nombre, inquilino_correo, clausulas_adicionales) on public.contratos to authenticated;
