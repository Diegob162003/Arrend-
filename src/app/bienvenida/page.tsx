import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Marca } from "@/components/marca";
import { getUsuario } from "@/lib/auth";
import { FormularioBienvenida } from "./formulario-bienvenida";

export const metadata: Metadata = {
  title: "Bienvenida",
  robots: { index: false },
};

export default async function Bienvenida() {
  const usuario = await getUsuario();
  if (usuario.completo) redirect("/inicio");

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10">
      <Marca className="mb-10" />
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold tracking-tight">Cuéntanos un poco de ti</h1>
        <p className="mt-2 text-muted-foreground">Con esto armamos tu panel. Lo puedes cambiar después.</p>
        <FormularioBienvenida nombreInicial={usuario.nombre ?? ""} />
      </div>
    </main>
  );
}
