import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Usuario = {
  id: string;
  correo: string | null;
  nombre: string | null;
  esArrendador: boolean;
  esInquilino: boolean;
  completo: boolean;
};

/**
 * Capa de acceso a datos: única puerta para saber quién es el usuario actual.
 * Valida el JWT con getClaims y lee la fila propia (RLS impide leer otras).
 */
export const getUsuario = cache(async (): Promise<Usuario> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const claims = auth?.claims;
  if (!claims) redirect("/ingresar");

  const { data: fila, error } = await supabase
    .from("usuarios")
    .select("nombre, es_arrendador, es_inquilino, acepto_datos_en")
    .eq("id", claims.sub)
    .single();

  if (error || !fila) redirect("/ingresar");

  return {
    id: claims.sub,
    correo: typeof claims.email === "string" ? claims.email : null,
    nombre: fila.nombre,
    esArrendador: fila.es_arrendador,
    esInquilino: fila.es_inquilino,
    completo:
      Boolean(fila.nombre) && Boolean(fila.acepto_datos_en) && (fila.es_arrendador || fila.es_inquilino),
  };
});
