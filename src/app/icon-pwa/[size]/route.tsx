import { ImageResponse } from "next/og";
import { ISOTIPO } from "@/components/isotipo";

const TAMANOS = ["192", "512"] as const;

export function generateStaticParams() {
  return TAMANOS.map((size) => ({ size }));
}

// Ícono de la app instalada: fondo verde a sangre y el isotipo al 60 % (zona segura de íconos adaptables).
export async function GET(_request: Request, { params }: RouteContext<"/icon-pwa/[size]">) {
  const { size } = await params;
  const lado = TAMANOS.includes(size as (typeof TAMANOS)[number]) ? Number(size) : 512;
  const simbolo = Math.round(lado * 0.6);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: ISOTIPO.fondo,
      }}
    >
      <svg width={simbolo} height={simbolo} viewBox="4 4 24 24">
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
    </div>,
    { width: lado, height: lado },
  );
}
