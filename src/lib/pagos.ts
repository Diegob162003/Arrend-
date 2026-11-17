import type { Database } from "./database.types";

type EstadoPago = Database["public"]["Enums"]["estado_pago"];

/**
 * Puntualidad de un pago. Se calcula con las fechas; no se guarda.
 * - pendiente: no se ha pagado y todavía no vence.
 * - a_tiempo: se pagó hasta la fecha límite.
 * - con_atraso: se pagó después de la fecha límite.
 * - vencido: no se ha pagado y la fecha límite ya pasó.
 * T12 (registro de pagos) y T14 (recordatorios) usan estos mismos nombres.
 */
export type Puntualidad = "pendiente" | "a_tiempo" | "con_atraso" | "vencido";

export type PagoConFechas = {
  estado: EstadoPago;
  fecha_limite: string;
  fecha_pago: string | null;
};

const ZONA_COLOMBIA = "America/Bogota";

/** Fecha de hoy en Colombia como "aaaa-mm-dd", sin importar la zona del servidor. */
export function hoyEnColombia(ahora = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_COLOMBIA }).format(ahora);
}

/** Un pago cuenta como hecho si el inquilino lo reportó o el arrendador lo confirmó. Rechazado = no pagado. */
function fechaDePago(pago: PagoConFechas) {
  return pago.estado === "reportado" || pago.estado === "confirmado" ? pago.fecha_pago : null;
}

export function puntualidad(pago: PagoConFechas, hoy: string): Puntualidad {
  const pagadoEl = fechaDePago(pago);
  // Las fechas "aaaa-mm-dd" se comparan bien como texto.
  if (pagadoEl) return pagadoEl <= pago.fecha_limite ? "a_tiempo" : "con_atraso";
  return hoy > pago.fecha_limite ? "vencido" : "pendiente";
}

/** Días entre dos fechas "aaaa-mm-dd" (positivo si `hasta` es posterior). */
export function diasEntre(desde: string, hasta: string) {
  return Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 864e5);
}

/** Días de atraso: hasta el pago si se pagó tarde, hasta hoy si está vencido; 0 en los demás casos. */
export function diasDeAtraso(pago: PagoConFechas, hoy: string) {
  const estado = puntualidad(pago, hoy);
  if (estado === "con_atraso") return diasEntre(pago.fecha_limite, fechaDePago(pago)!);
  if (estado === "vencido") return diasEntre(pago.fecha_limite, hoy);
  return 0;
}

/** El primer pago sin hacer, en orden de fecha límite: el que toca ahora. */
export function proximoPago<T extends PagoConFechas>(pagos: T[]) {
  return pagos
    .filter((pago) => !fechaDePago(pago))
    .toSorted((a, b) => a.fecha_limite.localeCompare(b.fecha_limite))[0];
}

const MES = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" });

/** "2026-08-01" → "agosto de 2026" */
export function nombrePeriodo(periodo: string) {
  return MES.format(new Date(`${periodo}T00:00:00Z`));
}

export const NOMBRE_PUNTUALIDAD: Record<Puntualidad, string> = {
  pendiente: "Pendiente",
  a_tiempo: "A tiempo",
  con_atraso: "Con atraso",
  vencido: "Vencido",
};
