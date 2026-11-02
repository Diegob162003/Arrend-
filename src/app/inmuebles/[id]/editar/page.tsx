import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EncabezadoApp } from "@/components/encabezado-app";
import { getUsuario } from "@/lib/auth";
import { getInmueble } from "@/lib/inmuebles";
import { borrarInmueble, editarInmueble } from "../../actions";
import { FormularioInmueble } from "../../formulario-inmueble";
import { BorrarInmueble } from "./borrar-inmueble";

export const metadata: Metadata = {
  title: "Editar inmueble",
  robots: { index: false },
};

export default async function EditarInmueble({ params }: PageProps<"/inmuebles/[id]/editar">) {
  const { id } = await params;
  const usuario = await getUsuario();
  if (!usuario.completo) redirect("/bienvenida");

  const inmueble = await getInmueble(id);
  if (inmueble.arrendador_id !== usuario.id) notFound();

  return (
    <>
      <EncabezadoApp />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-6 pb-16 sm:px-8">
        <Link
          href={`/inmuebles/${inmueble.id}`}
          className="text-base text-muted-foreground underline-offset-4 hover:underline"
        >
          Volver al inmueble
        </Link>
        <h1 className="mt-2 mb-8 text-4xl font-bold tracking-tight">Editar datos</h1>

        <FormularioInmueble
          accion={editarInmueble.bind(null, inmueble.id)}
          textoBoton="Guardar cambios"
          iniciales={{
            direccion: inmueble.direccion,
            ciudad: inmueble.ciudad,
            tipo: inmueble.tipo,
            canonBase: inmueble.canon_base.toLocaleString("es-CO"),
            notas: inmueble.notas ?? "",
          }}
        />

        <section className="mt-16 border-t border-border pt-8">
          <h2 className="text-xl font-bold">Borrar inmueble</h2>
          {inmueble.contratos.length > 0 ? (
            <p className="mt-1 text-muted-foreground">
              Este inmueble tiene contratos, así que no se puede borrar. Así se conserva el historial de
              pagos.
            </p>
          ) : (
            <>
              <p className="mt-1 mb-4 text-muted-foreground">
                Se borran también sus fotos. No se puede deshacer.
              </p>
              <BorrarInmueble accion={borrarInmueble.bind(null, inmueble.id)} />
            </>
          )}
        </section>
      </main>
    </>
  );
}
