import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { duracionMeses, type Garantia } from "@/lib/contrato";
import type { DatosContrato } from "@/lib/plantilla-contrato";

export async function getContrato(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contratos")
    .select(
      `id, arrendador_id, inquilino_id, inquilino_nombre, inquilino_correo, fecha_inicio, fecha_fin,
       canon, dia_pago, garantia_tipo, estado, clausulas_adicionales, firmado_path,
       inmuebles (id, direccion, ciudad, tipo)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data?.inmuebles) notFound();
  return { ...data, inmueble: data.inmuebles };
}

export type Contrato = Awaited<ReturnType<typeof getContrato>>;

/** Lo que necesita la plantilla a partir de la fila guardada. */
export function datosDePlantilla(contrato: Contrato, arrendadorNombre: string): DatosContrato {
  return {
    arrendadorNombre,
    inquilinoNombre: contrato.inquilino_nombre ?? "el arrendatario",
    direccion: contrato.inmueble.direccion,
    ciudad: contrato.inmueble.ciudad,
    tipo: contrato.inmueble.tipo,
    fechaInicio: contrato.fecha_inicio,
    fechaFin: contrato.fecha_fin,
    duracionMeses: duracionMeses(contrato.fecha_inicio, contrato.fecha_fin),
    canon: contrato.canon,
    diaPago: contrato.dia_pago,
    garantia: (contrato.garantia_tipo ?? "ninguna") as Garantia,
    clausulasAdicionales: contrato.clausulas_adicionales,
  };
}

/** URL firmada del contrato escaneado, válida por una hora. */
export async function getUrlFirmado(contrato: Contrato) {
  if (!contrato.firmado_path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("contratos")
    .createSignedUrl(contrato.firmado_path, 60 * 60, { download: "contrato-firmado.pdf" });
  return data?.signedUrl ?? null;
}

/** Calendario de pagos del contrato, en orden. RLS deja verlo solo a las partes. */
export async function getPagos(contratoId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pagos")
    .select("id, periodo, valor, fecha_limite, fecha_pago, estado")
    .eq("contrato_id", contratoId)
    .order("periodo", { ascending: true });

  if (error) throw error;
  return data;
}

export type Pago = Awaited<ReturnType<typeof getPagos>>[number];
