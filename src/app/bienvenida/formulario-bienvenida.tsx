"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { guardarBienvenida, type EstadoBienvenida } from "./actions";

const OPCIONES = [
  { valor: "arrendador", titulo: "Arriendo un inmueble", detalle: "Llevo contratos, pagos e inventario." },
  { valor: "inquilino", titulo: "Vivo en arriendo", detalle: "Veo mis pagos y armo mi historial." },
  { valor: "ambos", titulo: "Las dos cosas", detalle: "Arriendo un inmueble y vivo en otro." },
] as const;

export function FormularioBienvenida({ nombreInicial }: { nombreInicial: string }) {
  const [estado, accion, enviando] = useActionState<EstadoBienvenida, FormData>(guardarBienvenida, {});
  const errores = estado.errores ?? {};

  return (
    <form action={accion} className="mt-8 space-y-8" noValidate>
      <div className="space-y-2">
        <Label htmlFor="nombre" className="text-base">
          Tu nombre
        </Label>
        <Input
          id="nombre"
          name="nombre"
          autoComplete="name"
          defaultValue={estado.valores?.nombre ?? nombreInicial}
          aria-invalid={Boolean(errores.nombre)}
          aria-describedby={errores.nombre ? "nombre-error" : undefined}
          className="h-12 text-base"
        />
        {errores.nombre && (
          <p id="nombre-error" className="text-sm text-destructive">
            {errores.nombre}
          </p>
        )}
      </div>

      <fieldset aria-describedby={errores.rol ? "rol-error" : undefined}>
        <legend className="mb-3 text-base font-medium">¿Cómo vas a usar Arrendú?</legend>
        <div className="space-y-3">
          {OPCIONES.map((opcion) => (
            <label
              key={opcion.valor}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-input bg-card p-4 transition-colors has-checked:border-primary has-checked:bg-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
            >
              <input
                type="radio"
                name="rol"
                value={opcion.valor}
                defaultChecked={estado.valores?.rol === opcion.valor}
                className="mt-1 size-4 accent-primary"
              />
              <span>
                <span className="block font-medium">{opcion.titulo}</span>
                <span className="block text-sm text-muted-foreground">{opcion.detalle}</span>
              </span>
            </label>
          ))}
        </div>
        {errores.rol && (
          <p id="rol-error" className="mt-2 text-sm text-destructive">
            {errores.rol}
          </p>
        )}
      </fieldset>

      <div>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="aceptoDatos"
            aria-invalid={Boolean(errores.aceptoDatos)}
            aria-describedby={errores.aceptoDatos ? "datos-error" : undefined}
            className="mt-1 size-4 accent-primary"
          />
          <span className="text-sm">
            Autorizo el tratamiento de mis datos según la{" "}
            <Link
              href="/privacidad"
              target="_blank"
              className="font-medium text-primary underline underline-offset-4"
            >
              política de tratamiento de datos
            </Link>
            .
          </span>
        </label>
        {errores.aceptoDatos && (
          <p id="datos-error" className="mt-2 text-sm text-destructive">
            {errores.aceptoDatos}
          </p>
        )}
      </div>

      {errores.general && (
        <p role="alert" className="text-sm text-destructive">
          {errores.general}
        </p>
      )}

      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={enviando}>
        {enviando ? "Guardando…" : "Guardar y continuar"}
      </Button>
    </form>
  );
}
