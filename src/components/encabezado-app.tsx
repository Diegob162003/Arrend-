import { Button } from "@/components/ui/button";
import { Marca } from "@/components/marca";
import { cerrarSesion } from "@/app/inicio/actions";

/** Encabezado de las pantallas con sesión iniciada. */
export function EncabezadoApp() {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-8">
      <Marca />
      <form action={cerrarSesion}>
        <Button type="submit" variant="ghost" size="lg" className="h-11 px-4 text-base">
          Cerrar sesión
        </Button>
      </form>
    </header>
  );
}
