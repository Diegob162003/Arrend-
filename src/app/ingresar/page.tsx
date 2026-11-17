import type { Metadata } from "next";
import { headers } from "next/headers";
import { Marca } from "@/components/marca";
import { env } from "@/lib/env";
import { FormularioIngreso } from "./formulario-ingreso";

export const metadata: Metadata = {
  title: "Ingresar",
  robots: { index: false },
};

const ERRORES: Record<string, string> = {
  enlace: "Ese enlace ya se usó o venció. Pide un código nuevo.",
  google: "No se pudo completar el ingreso con Google. Intenta de nuevo.",
};

export default async function Ingresar({ searchParams }: PageProps<"/ingresar">) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const { error } = await searchParams;
  const mensajeError = typeof error === "string" ? ERRORES[error] : undefined;

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10">
      <Marca className="mb-10" />
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold tracking-tight">Ingresa o crea tu cuenta</h1>
        <p className="mt-2 text-muted-foreground">
          Te enviamos un código a tu correo. No necesitas contraseña.
        </p>
        {mensajeError && (
          <p role="alert" className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {mensajeError}
          </p>
        )}
        <FormularioIngreso
          nonce={nonce}
          turnstileSiteKey={env.turnstileSiteKey}
          googleHabilitado={env.googleEnabled}
        />
      </div>
    </main>
  );
}
