import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Download, FileCheck } from "lucide-react";
import { ConfirmarBorrado } from "@/components/confirmar-borrado";
import { DocumentoContrato } from "@/components/documento-contrato";
import { EncabezadoApp } from "@/components/encabezado-app";
import { buttonVariants } from "@/components/ui/button";
import { partirDireccion } from "@/app/inmuebles/direccion";
import { getUsuario } from "@/lib/auth";
import { datosDePlantilla, getContrato, getUrlFirmado } from "@/lib/contratos";
import { plantillaContrato } from "@/lib/plantilla-contrato";
import { cn } from "@/lib/utils";
import { borrarBorrador } from "../actions";
import { NOMBRE_ESTADO_CONTRATO } from "../estado";
import { SubirFirmado } from "./subir-firmado";

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
  const urlFirmado = await getUrlFirmado(contrato);

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
          <div className="flex flex-wrap gap-3">
            {esBorrador && (
              <Link
                href={`/contratos/${contrato.id}/editar`}
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 px-5 text-base")}
              >
                Editar contrato
              </Link>
            )}
            <a
              href={`/contratos/${contrato.id}/pdf`}
              download
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 px-5 text-base")}
            >
              <Download aria-hidden="true" />
              Descargar PDF
            </a>
          </div>
        </div>

        {esBorrador ? (
          <section
            aria-labelledby="firma-titulo"
            className="mt-6 rounded-lg border-l-4 border-sello bg-muted p-5"
          >
            <h2 id="firma-titulo" className="text-xl font-bold">
              Para firmarlo
            </h2>
            <ol className="mt-3 list-decimal space-y-1 pl-5">
              <li>Revisa el texto con calma y descarga el PDF.</li>
              <li>
                Imprímanlo y fírmenlo{contrato.garantia_tipo === "codeudor" ? ", con el codeudor" : ""}.
              </li>
              <li>Escanéalo en PDF y súbelo. El contrato queda vigente y ya no se puede editar.</li>
            </ol>
            <p className="mt-3 mb-5 text-sm text-muted-foreground">
              La plantilla está en revisión con un abogado.
            </p>
            <SubirFirmado arrendadorId={usuario.id} contratoId={contrato.id} />
          </section>
        ) : (
          urlFirmado && (
            <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-accent p-4 text-accent-foreground">
              <FileCheck aria-hidden="true" className="size-5 shrink-0" />
              <span>Este contrato ya está firmado y sus términos no cambian.</span>
              <a
                href={urlFirmado}
                className="font-medium underline underline-offset-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver el contrato firmado
              </a>
            </p>
          )
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
