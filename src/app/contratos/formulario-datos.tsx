"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EstadoPaso } from "./actions";
import { Campo, describe } from "./campo";

export type ValoresDatos = {
  inquilinoNombre: string;
  inquilinoCorreo: string;
  fechaInicio: string;
  duracionMeses: string;
  canon: string;
  diaPago: string;
};

const DURACIONES = ["6", "12", "24", "36"];

export function FormularioDatos({
  accion: accionServidor,
  iniciales,
}: {
  accion: (anterior: EstadoPaso, formData: FormData) => Promise<EstadoPaso>;
  iniciales: ValoresDatos;
}) {
  const [estado, accion, enviando] = useActionState(accionServidor, {});
  const errores = estado.errores ?? {};
  const valores = { ...iniciales, ...estado.valores };

  return (
    <form action={accion} className="space-y-8" noValidate>
      <fieldset className="space-y-6">
        <legend className="mb-4 font-heading text-xl font-bold">Inquilino</legend>
        <Campo id="inquilinoNombre" etiqueta="Nombre completo" error={errores.inquilinoNombre}>
          <Input
            id="inquilinoNombre"
            name="inquilinoNombre"
            autoComplete="off"
            defaultValue={valores.inquilinoNombre}
            aria-invalid={Boolean(errores.inquilinoNombre)}
            aria-describedby={describe("inquilinoNombre", false, errores.inquilinoNombre)}
            className="h-12 text-base"
          />
        </Campo>
        <Campo
          id="inquilinoCorreo"
          etiqueta="Correo (opcional)"
          ayuda="Lo usaremos para invitarlo a ver el contrato y registrar sus pagos."
          error={errores.inquilinoCorreo}
        >
          <Input
            id="inquilinoCorreo"
            name="inquilinoCorreo"
            type="email"
            autoComplete="off"
            placeholder="nombre@correo.com"
            defaultValue={valores.inquilinoCorreo}
            aria-invalid={Boolean(errores.inquilinoCorreo)}
            aria-describedby={describe("inquilinoCorreo", true, errores.inquilinoCorreo)}
            className="h-12 text-base"
          />
        </Campo>
      </fieldset>

      <fieldset className="space-y-6">
        <legend className="mb-4 font-heading text-xl font-bold">Fechas y canon</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <Campo id="fechaInicio" etiqueta="Empieza el" error={errores.fechaInicio}>
            <Input
              id="fechaInicio"
              name="fechaInicio"
              type="date"
              defaultValue={valores.fechaInicio}
              aria-invalid={Boolean(errores.fechaInicio)}
              aria-describedby={describe("fechaInicio", false, errores.fechaInicio)}
              className="h-12 text-base"
            />
          </Campo>
          <Campo id="duracionMeses" etiqueta="Dura (meses)" error={errores.duracionMeses}>
            <Input
              id="duracionMeses"
              name="duracionMeses"
              inputMode="numeric"
              list="duraciones"
              defaultValue={valores.duracionMeses}
              aria-invalid={Boolean(errores.duracionMeses)}
              aria-describedby={describe("duracionMeses", false, errores.duracionMeses)}
              className="h-12 text-base tabular-nums"
            />
            <datalist id="duraciones">
              {DURACIONES.map((meses) => (
                <option key={meses} value={meses} />
              ))}
            </datalist>
          </Campo>
          <Campo id="canon" etiqueta="Canon mensual" error={errores.canon}>
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground"
              >
                $
              </span>
              <Input
                id="canon"
                name="canon"
                inputMode="numeric"
                defaultValue={valores.canon}
                onBlur={(evento) => {
                  const digitos = evento.currentTarget.value.replace(/[^\d]/g, "");
                  if (digitos) evento.currentTarget.value = Number(digitos).toLocaleString("es-CO");
                }}
                aria-invalid={Boolean(errores.canon)}
                aria-describedby={describe("canon", false, errores.canon)}
                className="h-12 pl-7 text-base tabular-nums"
              />
            </div>
          </Campo>
          <Campo
            id="diaPago"
            etiqueta="Se paga hasta el día"
            ayuda="Del 1 al 31 de cada mes."
            error={errores.diaPago}
          >
            <Input
              id="diaPago"
              name="diaPago"
              inputMode="numeric"
              defaultValue={valores.diaPago}
              aria-invalid={Boolean(errores.diaPago)}
              aria-describedby={describe("diaPago", true, errores.diaPago)}
              className="h-12 text-base tabular-nums"
            />
          </Campo>
        </div>
      </fieldset>

      {errores.general && (
        <p role="alert" className="text-sm text-destructive">
          {errores.general}
        </p>
      )}

      <Button type="submit" size="lg" className="h-12 w-full text-base sm:w-auto sm:px-8" disabled={enviando}>
        {enviando ? "Guardando…" : "Guardar y seguir"}
      </Button>
    </form>
  );
}
