import Link from "next/link";
import { cn } from "@/lib/utils";

export const PASOS = [
  { id: "datos", nombre: "Inquilino y fechas" },
  { id: "garantia", nombre: "Garantía" },
  { id: "clausulas", nombre: "Revisar" },
] as const;

export type Paso = (typeof PASOS)[number]["id"];

/** Los tres pasos del contrato. Los anteriores se pueden volver a abrir. */
export function Pasos({ actual, contratoId }: { actual: Paso; contratoId?: string }) {
  const indiceActual = PASOS.findIndex((paso) => paso.id === actual);

  return (
    <nav aria-label="Pasos del contrato">
      <ol className="flex gap-2">
        {PASOS.map((paso, i) => {
          const hecho = i < indiceActual;
          const contenido = (
            <>
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border text-sm font-bold tabular-nums",
                  i === indiceActual && "border-primary bg-primary text-primary-foreground",
                  hecho && "border-primary text-primary",
                  i > indiceActual && "border-border text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <span className={cn("text-sm", i === indiceActual ? "font-semibold" : "max-sm:sr-only")}>
                {paso.nombre}
              </span>
            </>
          );
          return (
            <li
              key={paso.id}
              className="flex flex-1 items-center gap-2 border-t-2 border-border pt-3 data-[hecho=true]:border-primary"
              data-hecho={i <= indiceActual}
            >
              {hecho && contratoId ? (
                <Link
                  href={`/contratos/${contratoId}/editar?paso=${paso.id}`}
                  className="flex min-h-11 items-center gap-2 underline-offset-4 hover:underline"
                >
                  {contenido}
                </Link>
              ) : (
                <span
                  className="flex min-h-11 items-center gap-2"
                  aria-current={i === indiceActual ? "step" : undefined}
                >
                  {contenido}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
