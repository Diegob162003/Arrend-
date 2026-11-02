import type { Database } from "@/lib/database.types";

type EstadoContrato = Database["public"]["Enums"]["estado_contrato"];

export const NOMBRE_ESTADO_CONTRATO: Record<EstadoContrato, string> = {
  borrador: "Borrador",
  activo: "Vigente",
  terminado: "Terminado",
  cancelado: "Cancelado",
};
