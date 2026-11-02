"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { fechaFin, pasoClausulasSchema, pasoDatosSchema, pasoGarantiaSchema } from "@/lib/contrato";
import { leerPesos } from "@/lib/formato";
import type { TablesUpdate } from "@/lib/database.types";

export type EstadoPaso = {
  errores?: Record<string, string | undefined>;
  valores?: Record<string, string>;
};

async function clienteConSesion() {
  // La acción se autoriza sola; RLS además impide tocar contratos ajenos.
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) redirect("/ingresar");
  return supabase;
}

function errores(error: z.ZodError) {
  const campos = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  return Object.fromEntries(Object.entries(campos).map(([campo, mensajes]) => [campo, mensajes?.[0]]));
}

const ERROR_GENERAL = "No se pudo guardar. Revisa tu conexión e intenta de nuevo.";

function leerDatos(formData: FormData) {
  const valores = Object.fromEntries(
    ["inquilinoNombre", "inquilinoCorreo", "fechaInicio", "duracionMeses", "canon", "diaPago"].map(
      (campo) => [campo, String(formData.get(campo) ?? "")],
    ),
  );
  const resultado = pasoDatosSchema.safeParse({
    ...valores,
    duracionMeses: Number(valores.duracionMeses) || Number.NaN,
    canon: leerPesos(valores.canon),
    diaPago: Number(valores.diaPago) || Number.NaN,
  });
  return { valores, resultado };
}

function filaDatos(datos: z.infer<typeof pasoDatosSchema>) {
  return {
    inquilino_nombre: datos.inquilinoNombre,
    inquilino_correo: datos.inquilinoCorreo,
    fecha_inicio: datos.fechaInicio,
    fecha_fin: fechaFin(datos.fechaInicio, datos.duracionMeses),
    canon: datos.canon,
    dia_pago: datos.diaPago,
  };
}

/** Paso 1 de un contrato nuevo: crea el borrador. */
export async function crearContrato(
  inmuebleId: string,
  _anterior: EstadoPaso,
  formData: FormData,
): Promise<EstadoPaso> {
  const { valores, resultado } = leerDatos(formData);
  if (!resultado.success) return { valores, errores: errores(resultado.error) };

  const supabase = await clienteConSesion();
  const { data, error } = await supabase
    .from("contratos")
    .insert({ inmueble_id: inmuebleId, ...filaDatos(resultado.data) })
    .select("id")
    .single();

  if (error || !data) return { valores, errores: { general: ERROR_GENERAL } };

  revalidatePath(`/inmuebles/${inmuebleId}`);
  redirect(`/contratos/${data.id}/editar?paso=garantia`);
}

async function actualizarBorrador(id: string, cambios: TablesUpdate<"contratos">) {
  const supabase = await clienteConSesion();
  const { data, error } = await supabase
    .from("contratos")
    .update(cambios)
    .eq("id", id)
    .eq("estado", "borrador")
    .select("id");
  return !error && Boolean(data?.length);
}

export async function guardarDatos(
  id: string,
  _anterior: EstadoPaso,
  formData: FormData,
): Promise<EstadoPaso> {
  const { valores, resultado } = leerDatos(formData);
  if (!resultado.success) return { valores, errores: errores(resultado.error) };
  if (!(await actualizarBorrador(id, filaDatos(resultado.data)))) {
    return { valores, errores: { general: ERROR_GENERAL } };
  }
  redirect(`/contratos/${id}/editar?paso=garantia`);
}

export async function guardarGarantia(
  id: string,
  _anterior: EstadoPaso,
  formData: FormData,
): Promise<EstadoPaso> {
  const valores = { garantia: String(formData.get("garantia") ?? "") };
  const resultado = pasoGarantiaSchema.safeParse(valores);
  if (!resultado.success) return { valores, errores: errores(resultado.error) };

  const { garantia } = resultado.data;
  if (!(await actualizarBorrador(id, { garantia_tipo: garantia === "ninguna" ? null : garantia }))) {
    return { valores, errores: { general: ERROR_GENERAL } };
  }
  redirect(`/contratos/${id}/editar?paso=clausulas`);
}

export async function guardarClausulas(
  id: string,
  _anterior: EstadoPaso,
  formData: FormData,
): Promise<EstadoPaso> {
  const valores = { clausulasAdicionales: String(formData.get("clausulasAdicionales") ?? "") };
  const resultado = pasoClausulasSchema.safeParse(valores);
  if (!resultado.success) return { valores, errores: errores(resultado.error) };

  if (!(await actualizarBorrador(id, { clausulas_adicionales: resultado.data.clausulasAdicionales }))) {
    return { valores, errores: { general: ERROR_GENERAL } };
  }
  revalidatePath(`/contratos/${id}`);
  redirect(`/contratos/${id}`);
}

export async function borrarBorrador(id: string, inmuebleId: string): Promise<{ error?: string }> {
  const supabase = await clienteConSesion();
  const { data, error } = await supabase
    .from("contratos")
    .delete()
    .eq("id", id)
    .eq("estado", "borrador")
    .select("id");
  if (error || !data?.length) return { error: "No se pudo borrar el borrador. Intenta de nuevo." };

  revalidatePath(`/inmuebles/${inmuebleId}`);
  redirect(`/inmuebles/${inmuebleId}`);
}
