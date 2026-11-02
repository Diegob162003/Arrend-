import type { TextoContrato } from "@/lib/plantilla-contrato";
import { cn } from "@/lib/utils";

/** El contrato como se va a firmar: una hoja con las cláusulas en orden. */
export function DocumentoContrato({ contrato, className }: { contrato: TextoContrato; className?: string }) {
  return (
    <article
      className={cn(
        "rounded-sm bg-card px-5 py-8 text-card-foreground shadow-[0_1px_0_var(--border),0_12px_32px_-16px_rgb(23_33_29/0.35)] ring-1 ring-border sm:px-12 sm:py-12",
        className,
      )}
    >
      <h2 className="text-center font-heading text-xl font-bold tracking-tight text-balance sm:text-2xl">
        {contrato.titulo}
      </h2>
      <p className="mx-auto mt-6 max-w-prose leading-relaxed">{contrato.encabezado}</p>
      <ol className="mx-auto mt-6 max-w-prose space-y-5">
        {contrato.clausulas.map((clausula) => (
          <li key={clausula.titulo}>
            <h3 className="font-heading text-base font-bold">{clausula.titulo}</h3>
            {clausula.texto.map((parrafo) => (
              <p key={parrafo} className="mt-1 leading-relaxed">
                {parrafo}
              </p>
            ))}
          </li>
        ))}
      </ol>
      <p className="mx-auto mt-8 max-w-prose leading-relaxed">{contrato.cierre}</p>
      <ul className="mx-auto mt-12 grid max-w-prose gap-x-10 gap-y-12 sm:grid-cols-2">
        {contrato.firmas.map((firma) => (
          <li key={firma.papel} className="border-t border-foreground pt-2 text-sm">
            <p className="font-bold uppercase">{firma.papel}</p>
            <p>{firma.nombre ?? "Nombre:"}</p>
            <p className="text-muted-foreground">C.C.</p>
          </li>
        ))}
      </ul>
    </article>
  );
}
