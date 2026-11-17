import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EncabezadoApp } from "@/components/encabezado-app";
import { crearContrato } from "@/app/contratos/actions";
import { FormularioDatos } from "@/app/contratos/formulario-datos";
import { Pasos } from "@/app/contratos/pasos";
import { partirDireccion } from "@/app/inmuebles/direccion";
import { getUsuario } from "@/lib/auth";
import { getInmueble } from "@/lib/inmuebles";

export const metadata: Metadata = {
  title: "Nuevo contrato",
  robots: { index: false },
};

/** Primer día del mes siguiente: el inicio más común de un arriendo. */
function inicioSugerido() {
  const hoy = new Date();
  return new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth() + 1, 1)).toISOString().slice(0, 10);
}

export default async function NuevoContrato({ params }: PageProps<"/inmuebles/[id]/contrato/nuevo">) {
  const { id } = await params;
  const usuario = await getUsuario();
  if (!usuario.completo) redirect("/bienvenida");

  const inmueble = await getInmueble(id);
  if (inmueble.arrendador_id !== usuario.id) notFound();
  // Si ya hay un borrador, se sigue ese en lugar de crear otro.
  const borrador = inmueble.contratos.find((contrato) => contrato.estado === "borrador");
  if (borrador) redirect(`/contratos/${borrador.id}/editar`);

  return (
    <>
      <EncabezadoApp />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-6 pb-16 sm:px-8">
        <Link
          href={`/inmuebles/${inmueble.id}`}
          className="text-base text-muted-foreground underline-offset-4 hover:underline"
        >
          {partirDireccion(inmueble.direccion).via}
        </Link>
        <h1 className="mt-2 mb-6 text-4xl font-bold tracking-tight">Nuevo contrato</h1>
        <Pasos actual="datos" />
        <div className="mt-8">
          <FormularioDatos
            accion={crearContrato.bind(null, inmueble.id)}
            iniciales={{
              inquilinoNombre: "",
              inquilinoCorreo: "",
              fechaInicio: inicioSugerido(),
              duracionMeses: "12",
              canon: inmueble.canon_base.toLocaleString("es-CO"),
              diaPago: "5",
            }}
          />
        </div>
      </main>
    </>
  );
}
