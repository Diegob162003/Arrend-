import { notFound, redirect } from "next/navigation";
import { renderToBuffer } from "@react-pdf/renderer";
import { getUsuario } from "@/lib/auth";
import { nombreArchivoContrato } from "@/lib/contrato";
import { datosDePlantilla, getContrato } from "@/lib/contratos";
import { ContratoPdf } from "@/lib/pdf/contrato-pdf";
import { plantillaContrato } from "@/lib/plantilla-contrato";

/** Descarga el contrato en PDF con el mismo texto de la vista. Se genera en cada petición. */
export async function GET(_request: Request, { params }: RouteContext<"/contratos/[id]/pdf">) {
  const { id } = await params;
  const usuario = await getUsuario();
  if (!usuario.completo) redirect("/bienvenida");

  const contrato = await getContrato(id);
  // Igual que la vista: el inquilino lo descargará cuando llegue la invitación (T10).
  if (contrato.arrendador_id !== usuario.id) notFound();

  const texto = plantillaContrato(datosDePlantilla(contrato, usuario.nombre ?? ""));
  const pdf = await renderToBuffer(<ContratoPdf contrato={texto} referencia={contrato.id.slice(0, 8)} />);
  const nombre = nombreArchivoContrato(contrato.inmueble.direccion);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
