"use client";

import { useRef, useState } from "react";
import { FileUp } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { errorArchivoFirmado, rutaFirmado } from "@/lib/contrato";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { marcarFirmado } from "../actions";

/** Sube el PDF escaneado con las firmas y deja el contrato vigente. */
export function SubirFirmado({ arrendadorId, contratoId }: { arrendadorId: string; contratoId: string }) {
  const entrada = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string>();

  async function subir(archivo: File | undefined) {
    if (!archivo) return;
    setError(undefined);

    const invalido = errorArchivoFirmado(archivo);
    if (invalido) {
      setError(invalido);
      if (entrada.current) entrada.current.value = "";
      return;
    }

    setSubiendo(true);
    const { error: errorSubida } = await createClient()
      .storage.from("contratos")
      // upsert: si se equivocó de archivo, lo reemplaza mientras el contrato sea borrador.
      .upload(rutaFirmado(arrendadorId, contratoId), archivo, {
        contentType: "application/pdf",
        upsert: true,
      });

    const resultado = errorSubida
      ? { error: "No se pudo subir el PDF. Revisa tu conexión e intenta de nuevo." }
      : await marcarFirmado(contratoId);

    setSubiendo(false);
    setError(resultado.error);
    if (entrada.current) entrada.current.value = "";
  }

  return (
    <div>
      <label
        className={cn(
          buttonVariants({ size: "lg" }),
          "h-11 cursor-pointer px-5 text-base has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
          subiendo && "pointer-events-none opacity-60",
        )}
      >
        <FileUp aria-hidden="true" />
        {subiendo ? "Subiendo contrato…" : "Subir contrato firmado"}
        <input
          ref={entrada}
          type="file"
          accept="application/pdf"
          disabled={subiendo}
          onChange={(evento) => subir(evento.currentTarget.files?.[0])}
          className="sr-only"
        />
      </label>
      <p className="sr-only" aria-live="polite">
        {subiendo ? "Subiendo el contrato firmado" : ""}
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
