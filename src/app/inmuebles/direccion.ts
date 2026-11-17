/**
 * "Calle 57 # 9-30, apto 402" → { via: "Calle 57 # 9-30", resto: "apto 402" }.
 * La nomenclatura va grande; el apartamento o el barrio, debajo.
 */
export function partirDireccion(direccion: string) {
  const coma = direccion.indexOf(",");
  if (coma === -1) return { via: direccion.trim(), resto: "" };
  return { via: direccion.slice(0, coma).trim(), resto: direccion.slice(coma + 1).trim() };
}

export type Situacion = "arrendado" | "borrador" | "disponible";

/** Lo que el arrendador necesita saber de un vistazo a partir de sus contratos. */
export function situacionInmueble(contratos: { estado: string }[]): Situacion {
  if (contratos.some((contrato) => contrato.estado === "activo")) return "arrendado";
  if (contratos.some((contrato) => contrato.estado === "borrador")) return "borrador";
  return "disponible";
}
