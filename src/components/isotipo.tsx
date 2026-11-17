/**
 * Isotipo de Arrendú: un techo sobre el sello amarillo de "pagado".
 * Las mismas formas se usan en el favicon (app/icon.svg) y en el ícono de la app instalada.
 */
export const ISOTIPO = {
  fondo: "#0f4c3a",
  techo: "#f3f6f3",
  sello: "#f2c230",
  // Coordenadas en una cuadrícula de 32×32.
  techoPath: "M6 16.5 16 8l10 8.5",
  selloCentro: { cx: 16, cy: 20.5, r: 4.25 },
} as const;

export function Isotipo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="8" fill={ISOTIPO.fondo} />
      <path
        d={ISOTIPO.techoPath}
        fill="none"
        stroke={ISOTIPO.techo}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle {...ISOTIPO.selloCentro} fill={ISOTIPO.sello} />
    </svg>
  );
}
