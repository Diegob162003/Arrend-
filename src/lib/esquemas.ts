import { z } from "zod";

export const correoSchema = z.object({
  correo: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Escribe tu correo.")
    .pipe(z.email("Ese correo no parece válido. Revisa que tenga @ y un dominio.")),
});

export const codigoSchema = z.object({
  codigo: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "El código tiene 6 números."),
});

export const ROLES = ["arrendador", "inquilino", "ambos"] as const;

export const bienvenidaSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre.").max(120, "El nombre es muy largo."),
  rol: z.enum(ROLES, "Elige cómo vas a usar Arrendú."),
  aceptoDatos: z.literal(true, "Para continuar, acepta la política de tratamiento de datos."),
});

export type BienvenidaInput = z.infer<typeof bienvenidaSchema>;

/** Convierte el rol elegido en las dos banderas de la tabla usuarios. */
export function rolABanderas(rol: (typeof ROLES)[number]) {
  return {
    es_arrendador: rol === "arrendador" || rol === "ambos",
    es_inquilino: rol === "inquilino" || rol === "ambos",
  };
}

/** Solo se permite volver a rutas internas después de ingresar (evita redirecciones abiertas). */
export function rutaSegura(next: string | null | undefined, porDefecto = "/inicio") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return porDefecto;
  }
  return next;
}
