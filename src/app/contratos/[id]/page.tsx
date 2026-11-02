import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ConfirmarBorrado } from "@/components/confirmar-borrado";
import { DocumentoContrato } from "@/components/documento-contrato";
import { EncabezadoApp } from "@/components/encabezado-app";
import { buttonVariants } from "@/components/ui/button";
import { partirDireccion } from "@/app/inmuebles/direccion";
import { getUsuario } from "@/lib/auth";
import { datosDePlantilla, getContrato } from "@/lib/contratos";
import { plantillaContrato } from "@/lib/plantilla-contrato";
import { cn } from "@/lib/utils";
import { borrarBorrador } from "../actions";
import { NOMBRE_ESTADO_CONTRATO } from "../estado";

export const metadata: Metadata = {
  title: "Contrato",
  robots: { index: false },
};

export default async function Contrato({ params }: PageProps<"/contratos/[id]">) {
  const { id } = await params;
  const usuario = await getUsuario();
  if (!usuario.completo) redirect("/bienvenida");

  const contrato = await getContrato(id);
  // La vista del inquilino llega con la invitación (T10).
  if (contrato.arrendador_id !== usuario.id) notFound();

  const esBorrador = contrato.estado === "borrador";
  const documento = plantillaContrato(datosDePlantilla(contrato, usuario.nombre ?? ""));

  return (
    <>
      <EncabezadoApp />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-16 sm:px-8">
        <Link
          href={`/inmuebles/${contrato.inmueble.id}`}
          className="text-base text-muted-foreground underline-offset-4 hover:underline"
        >
          {partirDireccion(contrato.inmueble.direccion).via}
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Contrato con {contrato.inquilino_nombre?.split(" ")[0] ?? "el inquilino"}
            </h1>
            <p className="mt-2 text-muted-foreground">{NOMBRE_ESTADO_CONTRATO[contrato.estado]}</p>
          </div>
          {esBorrador && (
            <Link
              href={`/contratos/${contrato.id}/editar`}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 px-5 text-base")}
            >
              Editar contrato
            </Link>
          )}
        </div>

        {esBorrador && (
          <p className="mt-6 rounded-lg border-l-4 border-sello bg-muted p-4 text-sm">
            Revisa el texto con calma. Pronto podrás descargarlo en PDF, enviarlo al inquilino y subir el
            contrato firmado. La plantilla está en revisión con un abogado.
          </p>
        )}

        <DocumentoContrato contrato={documento} className="mt-8" />

        {esBorrador && (
          <section className="mt-12 border-t border-border pt-8">
            <h2 className="text-xl font-bold">Borrar borrador</h2>
            <p className="mt-1 mb-4 text-muted-foreground">No se puede deshacer.</p>
            <ConfirmarBorrado
              accion={borrarBorrador.bind(null, contrato.id, contrato.inmueble.id)}
              texto="Borrar borrador"
            />
          </section>
        )}
      </main>
    </>
  );
}
