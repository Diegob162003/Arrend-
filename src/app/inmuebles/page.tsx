import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EncabezadoApp } from "@/components/encabezado-app";
import { Isotipo } from "@/components/isotipo";
import { buttonVariants } from "@/components/ui/button";
import { getUsuario } from "@/lib/auth";
import { NOMBRE_TIPO_INMUEBLE } from "@/lib/esquemas";
import { formatoPesos } from "@/lib/formato";
import { getFotos, getInmuebles } from "@/lib/inmuebles";
import { cn } from "@/lib/utils";
import { partirDireccion, situacionInmueble } from "./direccion";

export const metadata: Metadata = {
  title: "Tus inmuebles",
  robots: { index: false },
};

export default async function Inmuebles() {
  const usuario = await getUsuario();
  if (!usuario.completo) redirect("/bienvenida");
  if (!usuario.esArrendador) redirect("/inicio");

  const inmuebles = await getInmuebles();
  const portadas = await Promise.all(inmuebles.map((inmueble) => getFotos(usuario.id, inmueble.id, 1)));

  return (
    <>
      <EncabezadoApp />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-16 sm:px-8">
        <Link href="/inicio" className="text-base text-muted-foreground underline-offset-4 hover:underline">
          Mi panel
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-4xl font-bold tracking-tight">Tus inmuebles</h1>
          {inmuebles.length > 0 && (
            <Link
              href="/inmuebles/nuevo"
              className={cn(buttonVariants({ size: "lg" }), "h-11 px-5 text-base")}
            >
              Agregar inmueble
            </Link>
          )}
        </div>

        {inmuebles.length === 0 ? (
          <section className="mt-10 max-w-lg rounded-xl border border-dashed border-border p-8">
            <h2 className="text-2xl font-bold">Empieza por tu primer inmueble</h2>
            <p className="mt-2 text-muted-foreground">
              Con la dirección y el canon ya puedes crear el contrato. Las fotos las puedes agregar después.
            </p>
            <Link
              href="/inmuebles/nuevo"
              className={cn(buttonVariants({ size: "lg" }), "mt-6 h-12 px-6 text-base")}
            >
              Agregar inmueble
            </Link>
          </section>
        ) : (
          <ul className="mt-8 divide-y divide-border border-y border-border">
            {inmuebles.map((inmueble, i) => {
              const { via, resto } = partirDireccion(inmueble.direccion);
              const portada = portadas[i][0];
              const situacion = situacionInmueble(inmueble.contratos);
              return (
                <li key={inmueble.id}>
                  <Link
                    href={`/inmuebles/${inmueble.id}`}
                    className="group flex items-center gap-4 py-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:gap-6"
                  >
                    <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted sm:size-24">
                      {portada ? (
                        // eslint-disable-next-line @next/next/no-img-element -- URL firmada que vence; no pasa por el optimizador.
                        <img src={portada.url} alt="" className="size-full object-cover" />
                      ) : (
                        <Isotipo className="size-9 opacity-40 grayscale" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-heading text-2xl leading-tight font-bold tracking-tight group-hover:underline group-hover:underline-offset-4 sm:text-3xl">
                        {via}
                      </p>
                      <p className="mt-1 truncate text-muted-foreground">
                        {[resto, inmueble.ciudad].filter(Boolean).join(", ")}
                      </p>
                      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span className="tabular-nums">
                          <strong className="font-semibold">{formatoPesos(inmueble.canon_base)}</strong> al
                          mes
                        </span>
                        <span className="text-muted-foreground">{NOMBRE_TIPO_INMUEBLE[inmueble.tipo]}</span>
                        <Situacion situacion={situacion} />
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}

function Situacion({ situacion }: { situacion: ReturnType<typeof situacionInmueble> }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
        situacion === "arrendado" && "bg-primary text-primary-foreground",
        situacion === "borrador" && "bg-accent text-accent-foreground",
        situacion === "disponible" && "border border-border text-muted-foreground",
      )}
    >
      {situacion === "arrendado"
        ? "Arrendado"
        : situacion === "borrador"
          ? "Contrato en borrador"
          : "Disponible"}
    </span>
  );
}
