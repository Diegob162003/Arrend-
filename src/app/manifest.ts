import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Arrendú",
    short_name: "Arrendú",
    description: "Contrato, pagos, recibos e inventario de tu arriendo en un solo lugar.",
    lang: "es-CO",
    start_url: "/inicio",
    scope: "/",
    display: "standalone",
    background_color: "#f3f6f3",
    theme_color: "#0f4c3a",
    icons: [
      { src: "/icon-pwa/192", sizes: "192x192", type: "image/png" },
      { src: "/icon-pwa/512", sizes: "512x512", type: "image/png" },
      { src: "/icon-pwa/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
