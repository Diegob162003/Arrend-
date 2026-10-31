import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Marca } from "@/components/marca";
import { Recibo } from "@/components/recibo";
import { cn } from "@/lib/utils";

const paraArrendadores = [
  "Contrato en PDF conforme a la Ley 820, sin cláusulas ilegales.",
  "Recordatorio de pago por WhatsApp con el mensaje listo.",
  "Un recibo en PDF por cada pago confirmado.",
  "Acta de entrega con fotos por ambiente, aceptada por los dos.",
  "Aviso del incremento anual calculado con el IPC.",
];

const paraInquilinos = [
  "Tu contrato, tus pagos y tus recibos siempre a mano.",
  "Un historial de pagos a tiempo que nadie puede inventar.",
  "Referencias de tus arrendadores anteriores en un solo lugar.",
  "Tú decides con quién compartes tu perfil y hasta cuándo.",
];

export default function Inicio() {
  return (
    <>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
        <Marca />
        <nav aria-label="Cuenta" className="flex items-center gap-2">
          <Link
            href="/ingresar"
            className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "h-11 px-4 text-base")}
          >
            Ingresar
          </Link>
          <Link
            href="/ingresar"
            className={cn(buttonVariants({ size: "lg" }), "hidden h-11 px-4 text-base sm:inline-flex")}
          >
            Empezar gratis
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-8 pb-14 sm:px-8 md:grid-cols-[1.15fr_1fr] md:pt-16 md:pb-20">
          <div>
            <h1 className="max-w-[14ch] text-5xl leading-[1.02] font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
              Tu arriendo en orden, sin inmobiliaria.
            </h1>
            <p className="mt-6 max-w-[52ch] text-lg text-muted-foreground sm:text-xl">
              Lleva el contrato, los pagos, los recibos y el inventario con fotos desde el celular. Cada pago
              a tiempo queda en el historial de tu inquilino, y ese historial le abre puertas en su próximo
              arriendo.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/ingresar" className={cn(buttonVariants({ size: "lg" }), "h-12 px-6 text-base")}>
                Empezar gratis
              </Link>
              <p className="text-sm text-muted-foreground">Gratis para tu primer inmueble.</p>
            </div>
          </div>
          <Recibo />
        </section>

        <section aria-labelledby="para-quien" className="border-t border-border bg-card/60">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-8">
            <h2 id="para-quien" className="sr-only">
              Para quién es Arrendú
            </h2>
            <div className="grid gap-12 md:grid-cols-2">
              <Lista titulo="Si arriendas tu inmueble" items={paraArrendadores} />
              <Lista titulo="Si vives en arriendo" items={paraInquilinos} />
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-8">
        <p>Arrendú está en piloto en Bogotá y Soacha.</p>
        <Link href="/privacidad" className="underline underline-offset-4 hover:text-foreground">
          Tratamiento de datos
        </Link>
      </footer>
    </>
  );
}

function Lista({ titulo, items }: { titulo: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-2xl font-bold">{titulo}</h3>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span aria-hidden="true" className="mt-2.5 size-2 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
