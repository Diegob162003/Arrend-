import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Marca } from "@/components/marca";
import { getUsuario } from "@/lib/auth";
import { cerrarSesion } from "./actions";

export const metadata: Metadata = {
  title: "Mi panel",
  robots: { index: false },
};

export default async function Panel() {
  const usuario = await getUsuario();
  if (!usuario.completo) redirect("/bienvenida");

  const primerNombre = usuario.nombre?.split(" ")[0];

  return (
    <>
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-8">
        <Marca />
        <form action={cerrarSesion}>
          <Button type="submit" variant="ghost" size="lg" className="h-11 px-4 text-base">
            Cerrar sesión
          </Button>
        </form>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-16 sm:px-8">
        <h1 className="text-4xl font-bold tracking-tight">Hola, {primerNombre}</h1>
        <p className="mt-2 text-muted-foreground">{usuario.correo}</p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {usuario.esArrendador && (
            <Seccion
              titulo="Tus inmuebles"
              texto="Aquí vas a registrar tus inmuebles, crear contratos y ver los pagos del mes. Estamos terminando esta parte."
            />
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

function Seccion({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-2xl font-bold">{titulo}</h2>
      <p className="mt-2 text-muted-foreground">{texto}</p>
    </section>
  );
}
