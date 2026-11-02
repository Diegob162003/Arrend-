"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { GARANTIAS, NOMBRE_GARANTIA, type Garantia } from "@/lib/contrato";
import type { EstadoPaso } from "./actions";

export function FormularioGarantia({
  accion: accionServidor,
  inicial,
}: {
  accion: (anterior: EstadoPaso, formData: FormData) => Promise<EstadoPaso>;
  inicial: Garantia | null;
}) {
  const [estado, accion, enviando] = useActionState(accionServidor, {});
  const errores = estado.errores ?? {};
  const elegida = estado.valores?.garantia ?? inicial;

  return (
    <form action={accion} className="space-y-8" noValidate>
      <fieldset aria-describedby={errores.garantia ? "garantia-error" : undefined}>
        <legend className="mb-4 font-heading text-xl font-bold">¿Qué garantía pides?</legend>
        <div className="space-y-3">
          {GARANTIAS.map((garantia) => (
            <label
              key={garantia}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-input bg-card p-4 transition-colors has-checked:border-primary has-checked:bg-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
            >
              <input
                type="radio"
                name="garantia"
                value={garantia}
                defaultChecked={elegida === garantia}
                className="mt-1 size-4 accent-primary"
              />
              <span>
                <span className="block font-medium">{NOMBRE_GARANTIA[garantia].titulo}</span>
                <span className="block text-sm text-muted-foreground">
                  {NOMBRE_GARANTIA[garantia].detalle}
                </span>
              </span>
            </label>
          ))}
        </div>
        {errores.garantia && (
          <p id="garantia-error" role="alert" className="mt-2 text-sm text-destructive">
            {errores.garantia}
          </p>
        )}
      </fieldset>

      <aside className="rounded-lg border-l-4 border-sello bg-muted p-4">
        <p className="font-semibold">¿Y el depósito?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          En vivienda, la ley no permite pedir depósito en dinero ni garantías como hipoteca o prenda (Ley 820
          de 2003, art. 16). Un contrato con depósito te puede traer problemas; por eso Arrendú no lo incluye.
        </p>
      </aside>

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
