import type { Pago } from "@/lib/contratos";
import { formatoFecha } from "@/lib/contrato";
import { formatoPesos } from "@/lib/formato";
import {
  diasDeAtraso,
  NOMBRE_PUNTUALIDAD,
  nombrePeriodo,
  proximoPago,
  puntualidad,
  type Puntualidad,
} from "@/lib/pagos";
import { cn } from "@/lib/utils";

const ESTILO_PUNTUALIDAD: Record<Puntualidad, string> = {
  pendiente: "text-muted-foreground",
  a_tiempo: "text-primary",
  con_atraso: "bg-sello px-1.5 text-sello-foreground",
  vencido: "bg-destructive/15 px-1.5 text-destructive",
};

function dias(n: number) {
  return n === 1 ? "1 día" : `${n} días`;
}

/** La libreta de cuentas del contrato: lo que toca ahora y un renglón por mes. */
export function CalendarioPagos({ pagos, hoy }: { pagos: Pago[]; hoy: string }) {
  if (pagos.length === 0) return null;

  const proximo = proximoPago(pagos);
  const estadoProximo = proximo && puntualidad(proximo, hoy);

  return (
    <section className="mt-10" aria-labelledby="pagos-titulo">
      <h2 id="pagos-titulo" className="text-2xl font-bold">
        Pagos
      </h2>

      {proximo ? (
        <p className="mt-3 text-lg text-balance">
          {estadoProximo === "vencido" ? (
            <>
              El pago de {nombrePeriodo(proximo.periodo)} venció el {formatoFecha(proximo.fecha_limite)}, hace{" "}
              {dias(diasDeAtraso(proximo, hoy))}.
            </>
          ) : (
            <>
              El próximo pago es el de {nombrePeriodo(proximo.periodo)} y vence el{" "}
              {formatoFecha(proximo.fecha_limite)}.
            </>
          )}{" "}
          <span className="font-heading text-3xl font-bold whitespace-nowrap tabular-nums">
            {formatoPesos(proximo.valor)}
          </span>
        </p>
      ) : (
        <p className="mt-3 text-lg">Todos los pagos del contrato están hechos.</p>
      )}

      <table className="mt-6 w-full border-y border-border text-left">
        <caption className="sr-only">Calendario de pagos, un renglón por mes</caption>
        <thead className="text-sm text-muted-foreground">
          <tr className="border-b border-border">
            <th scope="col" className="py-2 pr-3 font-normal">
              Mes
            </th>
            <th scope="col" className="py-2 pr-3 font-normal">
              Vence
            </th>
            <th scope="col" className="hidden py-2 pr-3 text-right font-normal sm:table-cell">
              Valor
            </th>
            <th scope="col" className="py-2 font-normal">
              Estado
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {pagos.map((pago) => {
            const estado = puntualidad(pago, hoy);
            const atraso = diasDeAtraso(pago, hoy);
            return (
              <tr key={pago.id} className={cn(pago.id === proximo?.id && "bg-muted")}>
                <th scope="row" className="py-3 pr-3 font-medium first-letter:uppercase">
                  {nombrePeriodo(pago.periodo)}
                </th>
                <td className="py-3 pr-3 tabular-nums">{formatoFecha(pago.fecha_limite)}</td>
                <td className="hidden py-3 pr-3 text-right tabular-nums sm:table-cell">
                  {formatoPesos(pago.valor)}
                </td>
                <td className="py-3">
                  <span className={cn("rounded-sm font-semibold", ESTILO_PUNTUALIDAD[estado])}>
                    {NOMBRE_PUNTUALIDAD[estado]}
                  </span>
                  {atraso > 0 && <span className="text-sm text-muted-foreground"> ({dias(atraso)})</span>}
                  {pago.estado === "reportado" && (
                    <span className="block text-sm text-muted-foreground">Reportado, falta confirmarlo</span>
                  )}
                  {pago.estado === "confirmado" && pago.fecha_pago && (
                    <span className="block text-sm text-muted-foreground">
                      Pagó el {formatoFecha(pago.fecha_pago)}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
