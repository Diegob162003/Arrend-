import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EncabezadoApp } from "@/components/encabezado-app";
import { getUsuario } from "@/lib/auth";
import { crearInmueble } from "../actions";
import { FormularioInmueble } from "../formulario-inmueble";

export const metadata: Metadata = {
  title: "Agregar inmueble",
  robots: { index: false },
};

export default async function NuevoInmueble() {
  const usuario = await getUsuario();
  if (!usuario.completo) redirect("/bienvenida");
  if (!usuario.esArrendador) redirect("/inicio");

  return (
    <>
      <EncabezadoApp />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-6 pb-16 sm:px-8">
        <Link
          href="/inmuebles"
          className="text-base text-muted-foreground underline-offset-4 hover:underline"
        >
          Tus inmuebles
        </Link>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Agregar inmueble</h1>
        <p className="mt-2 mb-8 text-muted-foreground">Las fotos las agregas en el siguiente paso.</p>
        <FormularioInmueble accion={crearInmueble} textoBoton="Guardar inmueble" />
      </main>
    </>
  );
}
