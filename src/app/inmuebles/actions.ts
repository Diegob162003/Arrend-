"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { inmuebleSchema } from "@/lib/esquemas";
import { leerPesos } from "@/lib/formato";

type Campo = "direccion" | "ciudad" | "tipo" | "canonBase" | "notas";

export type EstadoInmueble = {
  errores?: Partial<Record<Campo | "general", string>>;
  valores?: Partial<Record<Campo, string>>;
};

function leerFormulario(formData: FormData) {
  const valores = {
    direccion: String(formData.get("direccion") ?? ""),
    ciudad: String(formData.get("ciudad") ?? ""),
    tipo: String(formData.get("tipo") ?? ""),
    canonBase: String(formData.get("canonBase") ?? ""),
    notas: String(formData.get("notas") ?? ""),
  };
  const resultado = inmuebleSchema.safeParse({ ...valores, canonBase: leerPesos(valores.canonBase) });
  return { valores, resultado };
}

function erroresDeCampos(error: z.ZodError) {
  const campos = z.flattenError(error).fieldErrors as Partial<Record<Campo, string[]>>;
  return Object.fromEntries(Object.entries(campos).map(([campo, mensajes]) => [campo, mensajes?.[0]]));
}

async function clienteConSesion() {
  // La acción se autoriza sola; RLS además impide tocar inmuebles ajenos.
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) redirect("/ingresar");
  return supabase;
}

export async function crearInmueble(_anterior: EstadoInmueble, formData: FormData): Promise<EstadoInmueble> {
  const { valores, resultado } = leerFormulario(formData);
  if (!resultado.success) return { valores, errores: erroresDeCampos(resultado.error) };

  const supabase = await clienteConSesion();
  const { direccion, ciudad, tipo, canonBase, notas } = resultado.data;
  const { data, error } = await supabase
    .from("inmuebles")
    .insert({ direccion, ciudad, tipo, canon_base: canonBase, notas })
    .select("id")
    .single();

  if (error || !data) {
    return {
      valores,
      errores: { general: "No se pudo guardar el inmueble. Revisa tu conexión e intenta de nuevo." },
    };
  }

  revalidatePath("/inmuebles");
  redirect(`/inmuebles/${data.id}`);
}

export async function editarInmueble(
  id: string,
  _anterior: EstadoInmueble,
  formData: FormData,
): Promise<EstadoInmueble> {
  const { valores, resultado } = leerFormulario(formData);
  if (!resultado.success) return { valores, errores: erroresDeCampos(resultado.error) };

  const supabase = await clienteConSesion();
  const { direccion, ciudad, tipo, canonBase, notas } = resultado.data;
  const { data, error } = await supabase
    .from("inmuebles")
    .update({ direccion, ciudad, tipo, canon_base: canonBase, notas })
    .eq("id", id)
    .select("id");

  if (error || !data?.length) {
    return { valores, errores: { general: "No se pudieron guardar los cambios. Intenta de nuevo." } };
  }

  revalidatePath("/inmuebles");
  redirect(`/inmuebles/${id}`);
}

export type EstadoBorrado = { error?: string };

export async function borrarInmueble(id: string): Promise<EstadoBorrado> {
  const supabase = await clienteConSesion();

  const { count } = await supabase
    .from("contratos")
    .select("id", { count: "exact", head: true })
    .eq("inmueble_id", id);
  if (count) return { error: "Este inmueble tiene contratos, así que no se puede borrar." };

  // Las fotos van primero: el permiso para borrarlas exige que el inmueble todavía exista.
  const carpeta = await carpetaDe(supabase, id);
  const { data: fotos } = await supabase.storage.from("inmuebles").list(carpeta);
  if (fotos?.length) {
    const { error } = await supabase.storage
      .from("inmuebles")
      .remove(fotos.map((foto) => `${carpeta}/${foto.name}`));
    if (error) return { error: "No se pudieron borrar las fotos. Intenta de nuevo." };
  }

  const { data, error } = await supabase.from("inmuebles").delete().eq("id", id).select("id");
  if (error?.code === "23503") {
    return { error: "Este inmueble tiene contratos, así que no se puede borrar." };
  }
  if (error || !data?.length) return { error: "No se pudo borrar el inmueble. Intenta de nuevo." };

  revalidatePath("/inmuebles");
  redirect("/inmuebles");
}

export async function borrarFoto(inmuebleId: string, nombre: string): Promise<EstadoBorrado> {
  if (!/^[\w-]+\.(jpg|webp)$/.test(nombre)) return { error: "Esa foto no existe." };

  const supabase = await clienteConSesion();
  const { data, error } = await supabase.storage
    .from("inmuebles")
    .remove([`${await carpetaDe(supabase, inmuebleId)}/${nombre}`]);

  if (error || !data?.length) return { error: "No se pudo borrar la foto. Intenta de nuevo." };

  revalidatePath(`/inmuebles/${inmuebleId}`);
  return {};
}

async function carpetaDe(supabase: Awaited<ReturnType<typeof createClient>>, inmuebleId: string) {
  const { data: auth } = await supabase.auth.getClaims();
  return `${auth?.claims.sub}/${inmuebleId}`;
}
