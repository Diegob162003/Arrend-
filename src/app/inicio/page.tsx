import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EncabezadoApp } from "@/components/encabezado-app";
import { buttonVariants } from "@/components/ui/button";
import { getUsuario } from "@/lib/auth";
import { getInmuebles } from "@/lib/inmuebles";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mi panel",
  robots: { index: false },
};

export default async function Panel() {
  const usuario = await getUsuario();
  if (!usuario.completo) redirect("/bienvenida");

  const primerNombre = usuario.nombre?.split(" ")[0];
  const inmuebles = usuario.esArrendador ? await getInmuebles() : [];

  return (
    <>
      <EncabezadoApp />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-16 sm:px-8">
        <h1 className="text-4xl font-bold tracking-tight">Hola, {primerNombre}</h1>
        <p className="mt-2 text-muted-foreground">{usuario.correo}</p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {usuario.esArrendador && (
            <Seccion
              titulo="Tus inmuebles"
              texto={
                inmuebles.length === 0
                  ? "Registra tu primer inmueble para crear su contrato y llevar los pagos."
                  : inmuebles.length === 1
                    ? "Tienes 1 inmueble registrado."
                    : `Tienes ${inmuebles.length} inmuebles registrados.`
              }
            >
              <Link
                href={inmuebles.length === 0 ? "/inmuebles/nuevo" : "/inmuebles"}
                className={cn(buttonVariants({ size: "lg" }), "mt-5 h-11 px-5 text-base")}
              >
                {inmuebles.length === 0 ? "Agregar inmueble" : "Ver inmuebles"}
              </Link>
            </Seccion>
          )}
          {usuario.esInquilino && (
            <Seccion
              titulo="Tu arriendo"
              texto="Cuando tu arrendador te invite, aquí verás tu contrato, tus pagos y tus recibos."
            />
          )}
        </div>
      </main>
    </>
  );
}

function Seccion({ titulo, texto, children }: { titulo: string; texto: string; children?: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-2xl font-bold">{titulo}</h2>
      <p className="mt-2 text-muted-foreground">{texto}</p>
      {children}
    </section>
  );
}
