"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants, Button } from "@/components/ui/button";
import { nombreFoto, prepararFoto } from "@/lib/imagen";
import type { Foto } from "@/lib/inmuebles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { borrarFoto } from "../actions";

const MAXIMO_FOTOS = 30;

export function FotosInmueble({
  arrendadorId,
  inmuebleId,
  fotos,
}: {
  arrendadorId: string;
  inmuebleId: string;
  fotos: Foto[];
}) {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState<{ hechas: number; total: number } | null>(null);
  const [, iniciar] = useTransition();
  const cupo = MAXIMO_FOTOS - fotos.length;

  async function subir(archivos: FileList | null) {
    const lista = Array.from(archivos ?? []).slice(0, cupo);
    if (!lista.length) return;

    const supabase = createClient();
    let fallidas = 0;
    setSubiendo({ hechas: 0, total: lista.length });

    for (const [i, archivo] of lista.entries()) {
      try {
        const foto = await prepararFoto(archivo);
        const { error } = await supabase.storage
          .from("inmuebles")
          .upload(`${arrendadorId}/${inmuebleId}/${nombreFoto()}`, foto, { contentType: "image/jpeg" });
        if (error) throw error;
      } catch {
        fallidas += 1;
      }
      setSubiendo({ hechas: i + 1, total: lista.length });
    }

    setSubiendo(null);
    if (entrada.current) entrada.current.value = "";
    if (fallidas) {
      toast.error(
        fallidas === lista.length
          ? "No se pudieron subir las fotos. Usa fotos JPG o PNG e intenta de nuevo."
          : `${fallidas} de ${lista.length} fotos no se pudieron subir. Intenta de nuevo con esas.`,
      );
    }
    iniciar(() => router.refresh());
  }

  return (
    <section className="mt-10" aria-labelledby="fotos-titulo">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="fotos-titulo" className="text-2xl font-bold">
            Fotos
          </h2>
          <p className="text-sm text-muted-foreground">
            Solo las ven tú y tu inquilino. Se les quita la ubicación antes de guardarlas.
          </p>
        </div>
        {cupo > 0 && (
          <label
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-11 cursor-pointer px-5 text-base has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
              subiendo && "pointer-events-none opacity-60",
            )}
          >
            <ImagePlus aria-hidden="true" />
            {subiendo ? `Subiendo ${subiendo.hechas} de ${subiendo.total}…` : "Agregar fotos"}
            <input
              ref={entrada}
              type="file"
              accept="image/*"
              multiple
              disabled={Boolean(subiendo)}
              onChange={(evento) => subir(evento.currentTarget.files)}
              className="sr-only"
            />
          </label>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {subiendo ? `Subiendo foto ${subiendo.hechas} de ${subiendo.total}` : ""}
      </p>

      {fotos.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          Todavía no hay fotos. Toma una por ambiente: sirven para el aviso y como referencia antes del acta
          de entrega.
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {fotos.map((foto, i) => (
            <FotoMiniatura key={foto.nombre} foto={foto} numero={i + 1} inmuebleId={inmuebleId} />
          ))}
        </ul>
      )}
    </section>
  );
}

function FotoMiniatura({ foto, numero, inmuebleId }: { foto: Foto; numero: number; inmuebleId: string }) {
  const [borrando, iniciar] = useTransition();

  return (
    <li className={cn("relative overflow-hidden rounded-lg bg-muted", borrando && "opacity-50")}>
      <a
        href={foto.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada que vence; no pasa por el optimizador. */}
        <img
          src={foto.url}
          alt={`Foto ${numero} del inmueble`}
          loading="lazy"
          className="aspect-4/3 w-full object-cover"
        />
      </a>
      <Button
        variant="secondary"
        size="icon-lg"
        aria-label={`Quitar la foto ${numero}`}
        disabled={borrando}
        onClick={() =>
          iniciar(async () => {
            const { error } = await borrarFoto(inmuebleId, foto.nombre);
            if (error) toast.error(error);
          })
        }
        className="absolute top-2 right-2 size-11 rounded-full bg-background/85 backdrop-blur-sm"
      >
        <X aria-hidden="true" />
      </Button>
    </li>
  );
}
