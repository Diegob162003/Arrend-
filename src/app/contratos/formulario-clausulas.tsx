"use client";

import { useActionState, useDeferredValue, useState } from "react";
import { DocumentoContrato } from "@/components/documento-contrato";
import { Button } from "@/components/ui/button";
import { revisarClausulas } from "@/lib/contrato";
import { plantillaContrato, type DatosContrato } from "@/lib/plantilla-contrato";
import { cn } from "@/lib/utils";
import type { EstadoPaso } from "./actions";

export function FormularioClausulas({
  accion: accionServidor,
  datos,
}: {
  accion: (anterior: EstadoPaso, formData: FormData) => Promise<EstadoPaso>;
  datos: DatosContrato;
}) {
  const [estado, accion, enviando] = useActionState(accionServidor, {});
  const [texto, setTexto] = useState(
    estado.valores?.clausulasAdicionales ?? datos.clausulasAdicionales ?? "",
  );
  const textoDiferido = useDeferredValue(texto);
  const hallazgos = revisarClausulas(textoDiferido);
  const hayError = hallazgos.some((hallazgo) => hallazgo.nivel === "error");
  const errorServidor = estado.errores?.clausulasAdicionales;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
      <form action={accion} className="space-y-6 lg:sticky lg:top-6" noValidate>
        <div className="space-y-2">
          <label htmlFor="clausulasAdicionales" className="font-heading text-xl font-bold">
            Acuerdos adicionales (opcional)
          </label>
          <p id="clausulas-ayuda" className="text-sm text-muted-foreground">
            Escribe un acuerdo por línea. Por ejemplo: se permite una mascota pequeña.
          </p>
          <textarea
            id="clausulasAdicionales"
            name="clausulasAdicionales"
            rows={6}
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            aria-invalid={hayError || Boolean(errorServidor)}
            aria-describedby="clausulas-ayuda clausulas-revision"
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30"
          />
        </div>

        <div id="clausulas-revision" aria-live="polite" className="space-y-2">
          {hallazgos.map((hallazgo) => (
            <p
              key={hallazgo.mensaje}
              className={cn(
                "rounded-lg border-l-4 p-3 text-sm",
                hallazgo.nivel === "error"
                  ? "border-destructive bg-destructive/10 text-destructive"
                  : "border-sello bg-muted",
              )}
            >
              {hallazgo.mensaje}
            </p>
          ))}
          {errorServidor && !hayError && (
            <p role="alert" className="text-sm text-destructive">
              {errorServidor}
            </p>
          )}
        </div>

        {estado.errores?.general && (
          <p role="alert" className="text-sm text-destructive">
            {estado.errores.general}
          </p>
        )}

        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={enviando || hayError}>
          {enviando ? "Guardando…" : "Guardar contrato"}
        </Button>
        <p className="text-sm text-muted-foreground">
          Queda como borrador: puedes cambiarlo hasta que lo firmen.
        </p>
      </form>

      <section aria-label="Vista previa del contrato">
        <DocumentoContrato
          contrato={plantillaContrato({ ...datos, clausulasAdicionales: textoDiferido.trim() || null })}
        />
      </section>
    </div>
  );
}
