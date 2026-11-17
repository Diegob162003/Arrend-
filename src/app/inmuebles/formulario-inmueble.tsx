"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NOMBRE_TIPO_INMUEBLE, TIPOS_INMUEBLE } from "@/lib/esquemas";
import type { EstadoInmueble } from "./actions";

type Valores = NonNullable<EstadoInmueble["valores"]>;

export function FormularioInmueble({
  accion: accionServidor,
  iniciales = {},
  textoBoton,
}: {
  accion: (anterior: EstadoInmueble, formData: FormData) => Promise<EstadoInmueble>;
  iniciales?: Valores;
  textoBoton: string;
}) {
  const [estado, accion, enviando] = useActionState(accionServidor, {});
  const errores = estado.errores ?? {};
  const valores = estado.valores ?? iniciales;

  return (
    <form action={accion} className="space-y-8" noValidate>
      <Campo
        id="direccion"
        etiqueta="Dirección"
        ayuda="Como aparece en el recibo de servicios, con el número de apartamento si tiene."
        error={errores.direccion}
      >
        <Input
          id="direccion"
          name="direccion"
          autoComplete="street-address"
          placeholder="Calle 57 # 9-30, apto 402"
          defaultValue={valores.direccion}
          aria-invalid={Boolean(errores.direccion)}
          aria-describedby="direccion-ayuda direccion-error"
          className="h-12 text-base"
        />
      </Campo>

      <Campo id="ciudad" etiqueta="Ciudad o municipio" error={errores.ciudad}>
        <Input
          id="ciudad"
          name="ciudad"
          autoComplete="address-level2"
          placeholder="Bogotá"
          defaultValue={valores.ciudad}
          aria-invalid={Boolean(errores.ciudad)}
          aria-describedby="ciudad-error"
          className="h-12 text-base"
        />
      </Campo>

      <fieldset aria-describedby={errores.tipo ? "tipo-error" : undefined}>
        <legend className="mb-3 text-base font-medium">Tipo de inmueble</legend>
        <div className="flex flex-wrap gap-2">
          {TIPOS_INMUEBLE.map((tipo) => (
            <label
              key={tipo}
              className="flex h-11 cursor-pointer items-center rounded-full border border-input bg-card px-4 transition-colors has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
            >
              <input
                type="radio"
                name="tipo"
                value={tipo}
                defaultChecked={valores.tipo === tipo}
                className="sr-only"
              />
              {NOMBRE_TIPO_INMUEBLE[tipo]}
            </label>
          ))}
        </div>
        {errores.tipo && (
          <p id="tipo-error" className="mt-2 text-sm text-destructive">
            {errores.tipo}
          </p>
        )}
      </fieldset>

      <Campo
        id="canonBase"
        etiqueta="Canon mensual"
        ayuda="Lo que cobras hoy. Cada contrato puede tener su propio valor."
        error={errores.canonBase}
      >
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground"
          >
            $
          </span>
          <Input
            id="canonBase"
            name="canonBase"
            inputMode="numeric"
            placeholder="1.800.000"
            defaultValue={valores.canonBase}
            onBlur={(evento) => {
              const digitos = evento.currentTarget.value.replace(/[^\d]/g, "");
              if (digitos) evento.currentTarget.value = Number(digitos).toLocaleString("es-CO");
            }}
            aria-invalid={Boolean(errores.canonBase)}
            aria-describedby="canonBase-ayuda canonBase-error"
            className="h-12 pl-7 text-base tabular-nums"
          />
        </div>
      </Campo>

      <Campo
        id="notas"
        etiqueta="Notas (opcional)"
        ayuda="Solo las ves tú. Por ejemplo: parqueadero, administración incluida."
        error={errores.notas}
      >
        <textarea
          id="notas"
          name="notas"
          rows={3}
          defaultValue={valores.notas}
          aria-invalid={Boolean(errores.notas)}
          aria-describedby="notas-ayuda notas-error"
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30"
        />
      </Campo>

      {errores.general && (
        <p role="alert" className="text-sm text-destructive">
          {errores.general}
        </p>
      )}

      <Button type="submit" size="lg" className="h-12 w-full text-base sm:w-auto sm:px-8" disabled={enviando}>
        {enviando ? "Guardando…" : textoBoton}
      </Button>
    </form>
  );
}

function Campo({
  id,
  etiqueta,
  ayuda,
  error,
  children,
}: {
  id: string;
  etiqueta: string;
  ayuda?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-base">
        {etiqueta}
      </Label>
      {ayuda && (
        <p id={`${id}-ayuda`} className="text-sm text-muted-foreground">
          {ayuda}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
