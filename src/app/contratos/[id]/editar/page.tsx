import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EncabezadoApp } from "@/components/encabezado-app";
import { partirDireccion } from "@/app/inmuebles/direccion";
import { getUsuario } from "@/lib/auth";
import { duracionMeses, type Garantia } from "@/lib/contrato";
import { datosDePlantilla, getContrato } from "@/lib/contratos";
import { guardarClausulas, guardarDatos, guardarGarantia } from "../../actions";
import { FormularioClausulas } from "../../formulario-clausulas";
import { FormularioDatos } from "../../formulario-datos";
import { FormularioGarantia } from "../../formulario-garantia";
import { PASOS, Pasos, type Paso } from "../../pasos";

export const metadata: Metadata = {
  title: "Editar contrato",
  robots: { index: false },
};

export default async function EditarContrato({ params, searchParams }: PageProps<"/contratos/[id]/editar">) {
  const { id } = await params;
  const { paso: pasoPedido } = await searchParams;
  const paso: Paso = PASOS.some((p) => p.id === pasoPedido) ? (pasoPedido as Paso) : "datos";

  const usuario = await getUsuario();
  if (!usuario.completo) redirect("/bienvenida");

  const contrato = await getContrato(id);
  if (contrato.arrendador_id !== usuario.id) notFound();
  if (contrato.estado !== "borrador") redirect(`/contratos/${id}`);

  return (
    <>
      <EncabezadoApp />
      <main
        className={`mx-auto w-full flex-1 px-4 pt-6 pb-16 sm:px-8 ${paso === "clausulas" ? "max-w-6xl" : "max-w-2xl"}`}
      >
        <Link
          href={`/inmuebles/${contrato.inmueble.id}`}
          className="text-base text-muted-foreground underline-offset-4 hover:underline"
        >
          {partirDireccion(contrato.inmueble.direccion).via}
        </Link>
        <h1 className="mt-2 mb-6 text-4xl font-bold tracking-tight">Contrato en borrador</h1>
        <div className="max-w-2xl">
          <Pasos actual={paso} contratoId={contrato.id} />
        </div>

        <div className="mt-8">
          {paso === "datos" && (
            <FormularioDatos
              accion={guardarDatos.bind(null, contrato.id)}
              iniciales={{
                inquilinoNombre: contrato.inquilino_nombre ?? "",
                inquilinoCorreo: contrato.inquilino_correo ?? "",
                fechaInicio: contrato.fecha_inicio,
                duracionMeses: String(duracionMeses(contrato.fecha_inicio, contrato.fecha_fin)),
                canon: contrato.canon.toLocaleString("es-CO"),
                diaPago: String(contrato.dia_pago),
              }}
            />
          )}
          {paso === "garantia" && (
            <FormularioGarantia
              accion={guardarGarantia.bind(null, contrato.id)}
              inicial={(contrato.garantia_tipo as Garantia | null) ?? null}
            />
          )}
          {paso === "clausulas" && (
            <FormularioClausulas
              accion={guardarClausulas.bind(null, contrato.id)}
              datos={datosDePlantilla(contrato, usuario.nombre ?? "")}
            />
          )}
        </div>
      </main>
    </>
  );
}
