import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Foto = { nombre: string; url: string };

/** Las URL firmadas de las fotos duran una hora. */
const VIGENCIA_URL = 60 * 60;

export async function getInmuebles() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const { data, error } = await supabase
    .from("inmuebles")
    .select("id, direccion, ciudad, tipo, canon_base, contratos (estado)")
    .eq("arrendador_id", auth?.claims.sub ?? "")
    .order("creado_en", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getInmueble(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inmuebles")
    .select("id, arrendador_id, direccion, ciudad, tipo, canon_base, notas, contratos (id, estado)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) notFound();
  return data;
}

/** Fotos del inmueble, de la más antigua a la más reciente, con URL firmada. */
export async function getFotos(arrendadorId: string, inmuebleId: string, limite = 30): Promise<Foto[]> {
  const supabase = await createClient();
  const carpeta = `${arrendadorId}/${inmuebleId}`;
  const { data: archivos } = await supabase.storage
    .from("inmuebles")
    .list(carpeta, { limit: limite, sortBy: { column: "name", order: "asc" } });

  const nombres = (archivos ?? []).map((archivo) => archivo.name).filter((nombre) => !nombre.startsWith("."));
  if (!nombres.length) return [];

  const { data: firmadas } = await supabase.storage.from("inmuebles").createSignedUrls(
    nombres.map((nombre) => `${carpeta}/${nombre}`),
    VIGENCIA_URL,
  );

  return (firmadas ?? []).flatMap((firmada, i) =>
    firmada.signedUrl ? [{ nombre: nombres[i], url: firmada.signedUrl }] : [],
  );
}
