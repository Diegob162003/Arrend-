/** El recibo de arriendo: el objeto que el arrendador entrega y el inquilino guarda. */
export function Recibo() {
  return (
    <figure
      aria-label="Ejemplo de recibo de arriendo generado por Arrendú"
      className="recibo-borde mx-auto w-full max-w-sm bg-card px-6 pt-8 pb-6 text-card-foreground shadow-[0_24px_48px_-24px_rgb(15_76_58/0.35)]"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-heading text-lg font-bold">Recibo de arriendo</p>
          <p className="text-muted-foreground">Octubre de 2026</p>
        </div>
        <span className="sello shrink-0 rounded-md border-2 border-sello-foreground/70 bg-sello px-2.5 py-1 text-center font-heading text-sm leading-tight font-extrabold text-sello-foreground">
          Pagado
          <br />a tiempo
        </span>
      </div>

      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[0.95rem]">
        <dt className="text-muted-foreground">Inmueble</dt>
        <dd>Apto 302, Calle 45 # 13-20, Bogotá</dd>
        <dt className="text-muted-foreground">Inquilina</dt>
        <dd>Laura Méndez</dd>
        <dt className="text-muted-foreground">Fecha límite</dt>
        <dd>5 de octubre</dd>
        <dt className="text-muted-foreground">Pagó el</dt>
        <dd>3 de octubre</dd>
      </dl>

      <div className="mt-6 flex items-end justify-between border-t border-dashed border-border pt-4">
        <span className="text-muted-foreground">Canon</span>
        <span className="font-heading text-3xl font-bold tabular-nums">$1.450.000</span>
      </div>

      <p className="mt-6 rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
        Laura lleva 12 de 12 pagos a tiempo en Arrendú.
      </p>
    </figure>
  );
}
