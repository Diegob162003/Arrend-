"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { bienvenidaSchema, rolABanderas } from "@/lib/esquemas";

export type EstadoBienvenida = {
  errores?: Partial<Record<"nombre" | "rol" | "aceptoDatos" | "general", string>>;
  valores?: { nombre?: string; rol?: string };
};

export async function guardarBienvenida(
  _anterior: EstadoBienvenida,
  formData: FormData,
): Promise<EstadoBienvenida> {
  const valores = {
    nombre: String(formData.get("nombre") ?? ""),
    rol: String(formData.get("rol") ?? ""),
  };
  const resultado = bienvenidaSchema.safeParse({
    ...valores,
    aceptoDatos: formData.get("aceptoDatos") === "on",
  });

  if (!resultado.success) {
    const campos = z.flattenError(resultado.error).fieldErrors;
    return {
      valores,
      errores: {
        nombre: campos.nombre?.[0],
        rol: campos.rol?.[0],
        aceptoDatos: campos.aceptoDatos?.[0],
      },
    };
  }

  // La acción se autoriza sola: no confía en nada que venga del cliente para saber quién es.
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) redirect("/ingresar");

  const { error } = await supabase
    .from("usuarios")
    .update({
      nombre: resultado.data.nombre,
      ...rolABanderas(resultado.data.rol),
      acepto_datos_en: new Date().toISOString(),
    })
    .eq("id", auth.claims.sub);

  if (error) {
    return { valores, errores: { general: "No se pudo guardar. Revisa tu conexión e intenta de nuevo." } };
  }

  redirect("/inicio");
}
