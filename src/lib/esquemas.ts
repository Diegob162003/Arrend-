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

export const TIPOS_INMUEBLE = [
  "apartamento",
  "apartaestudio",
  "casa",
  "habitacion",
  "local",
  "otro",
] as const;

export const NOMBRE_TIPO_INMUEBLE: Record<(typeof TIPOS_INMUEBLE)[number], string> = {
  apartamento: "Apartamento",
  apartaestudio: "Apartaestudio",
  casa: "Casa",
  habitacion: "Habitación",
  local: "Local",
  otro: "Otro",
};

export const inmuebleSchema = z.object({
  direccion: z
    .string()
    .trim()
    .min(5, "Escribe la dirección completa, por ejemplo: Calle 57 # 9-30, apto 402.")
    .max(200, "La dirección es muy larga."),
  ciudad: z.string().trim().min(2, "Escribe la ciudad o el municipio.").max(80, "El nombre es muy largo."),
  tipo: z.enum(TIPOS_INMUEBLE, "Elige qué tipo de inmueble es."),
  canonBase: z
    .number("Escribe el canon en pesos, solo números.")
    .int()
    .min(50_000, "El canon debe ser de al menos $ 50.000.")
    .max(1_000_000_000, "Revisa el canon: parece demasiado alto."),
  notas: z
    .string()
    .trim()
    .max(1000, "Las notas pueden tener hasta 1.000 caracteres.")
    .transform((texto) => texto || null),
});

export type InmuebleInput = z.infer<typeof inmuebleSchema>;

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
