import type { Metadata } from "next";
import { Marca } from "@/components/marca";

export const metadata: Metadata = {
  title: "Tratamiento de datos",
};

// Borrador: el texto definitivo lo revisa un abogado antes del piloto (Ley 1581 de 2012).
export default function Privacidad() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-8">
      <Marca />
      <h1 className="mt-10 text-4xl font-bold tracking-tight">Política de tratamiento de datos</h1>
      <p className="mt-4 rounded-md bg-sello/30 px-3 py-2 text-sm">
        Borrador en revisión legal. El texto final se publicará antes de abrir el piloto.
      </p>

      <div className="mt-8 space-y-6 [&_h2]:text-2xl [&_h2]:font-bold">
        <section>
          <h2>Para qué usamos tus datos</h2>
          <p className="mt-2">
            Para crear tu cuenta, llevar los contratos, pagos e inventarios en los que participas, enviarte
            recordatorios y, si eres inquilino, armar el historial que tú decides compartir.
          </p>
        </section>
        <section>
          <h2>Qué no hacemos</h2>
          <p className="mt-2">
            No vendemos tus datos. Tu perfil y tus referencias no son públicos ni aparecen en buscadores: solo
            los ve quien recibe un enlace que tú creas. No pedimos copia de tu cédula ni datos bancarios.
          </p>
        </section>
        <section>
          <h2>Tus derechos</h2>
          <p className="mt-2">
            Puedes conocer, actualizar y rectificar tus datos, retirar tu autorización, descargar tu
            información y borrar tu cuenta en cualquier momento.
          </p>
        </section>
      </div>
    </main>
  );
}
