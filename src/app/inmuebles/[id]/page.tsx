import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EncabezadoApp } from "@/components/encabezado-app";
import { buttonVariants } from "@/components/ui/button";
import { getUsuario } from "@/lib/auth";
import { NOMBRE_TIPO_INMUEBLE } from "@/lib/esquemas";
import { formatoPesos } from "@/lib/formato";
import { getFotos, getInmueble } from "@/lib/inmuebles";
import { cn } from "@/lib/utils";
import { NOMBRE_ESTADO_CONTRATO } from "@/app/contratos/estado";
import { formatoFecha } from "@/lib/contrato";
import { partirDireccion } from "../direccion";
import { FotosInmueble } from "./fotos-inmueble";

export const metadata: Metadata = {
  title: "Inmueble",
  robots: { index: false },
};

export default async function Inmueble({ params }: PageProps<"/inmuebles/[id]">) {
  const { id } = await params;
  const usuario = await getUsuario();
  if (!usuario.completo) redirect("/bienvenida");

  const inmueble = await getInmueble(id);
  // El inquilino tendrá su propia vista del inmueble con el contrato (T10).
  if (inmueble.arrendador_id !== usuario.id) notFound();

  const fotos = await getFotos(usuario.id, inmueble.id);
  const { via, resto } = partirDireccion(inmueble.direccion);
  const contratos = inmueble.contratos.toSorted((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio));
  // Un contrato vigente o un borrador a la vez por inmueble.
  const ocupado = contratos.some(
    (contrato) => contrato.estado === "activo" || contrato.estado === "borrador",
  );

  return (
    <>
      <EncabezadoApp />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-16 sm:px-8">
        <Link
          href="/inmuebles"
          className="text-base text-muted-foreground underline-offset-4 hover:underline"
        >
          Tus inmuebles
        </Link>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">{via}</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              {[resto, inmueble.ciudad].filter(Boolean).join(", ")}
            </p>
          </div>
          <Link
            href={`/inmuebles/${inmueble.id}/editar`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 px-5 text-base")}
          >
            Editar datos
          </Link>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-4 border-y border-border py-5 sm:flex sm:gap-12">
          <div>
            <dt className="text-sm text-muted-foreground">Canon mensual</dt>
            <dd className="font-heading text-2xl font-bold tabular-nums">
              {formatoPesos(inmueble.canon_base)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Tipo</dt>
            <dd className="font-heading text-2xl font-bold">{NOMBRE_TIPO_INMUEBLE[inmueble.tipo]}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Contratos</dt>
            <dd className="font-heading text-2xl font-bold tabular-nums">{inmueble.contratos.length}</dd>
          </div>
        </dl>

        {inmueble.notas && (
          <section className="mt-8 max-w-prose">
            <h2 className="text-xl font-bold">Notas</h2>
            <p className="mt-1 whitespace-pre-line text-muted-foreground">{inmueble.notas}</p>
          </section>
        )}

        <section className="mt-10" aria-labelledby="contratos-titulo">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 id="contratos-titulo" className="text-2xl font-bold">
              Contratos
            </h2>
            {!ocupado && (
              <Link
                href={`/inmuebles/${inmueble.id}/contrato/nuevo`}
                className={cn(buttonVariants({ size: "lg" }), "h-11 px-5 text-base")}
              >
                Crear contrato
              </Link>
            )}
          </div>
          {contratos.length === 0 ? (
            <p className="mt-4 text-muted-foreground">
              Todavía no hay contratos. En tres pasos cortos armas uno conforme a la Ley 820.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border border-y border-border">
              {contratos.map((contrato) => (
                <li key={contrato.id}>
                  <Link
                    href={
                      contrato.estado === "borrador"
                        ? `/contratos/${contrato.id}/editar`
                        : `/contratos/${contrato.id}`
                    }
                    className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-4 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <span className="font-medium">{contrato.inquilino_nombre ?? "Sin inquilino"}</span>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {NOMBRE_ESTADO_CONTRATO[contrato.estado]}, del {formatoFecha(contrato.fecha_inicio)} al{" "}
                      {formatoFecha(contrato.fecha_fin)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <FotosInmueble arrendadorId={usuario.id} inmuebleId={inmueble.id} fotos={fotos} />
      </main>
    </>
  );
}
