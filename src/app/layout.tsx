import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { Atkinson_Hyperlegible_Next, Bricolage_Grotesque } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { RegistrarSW } from "@/components/registrar-sw";
import "./globals.css";

const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Arrendú: tu arriendo en orden, sin inmobiliaria",
    template: "%s | Arrendú",
  },
  description:
    "Contrato, pagos, recibos e inventario con fotos en un solo lugar. Y el inquilino construye su historial de buen pagador.",
  applicationName: "Arrendú",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f6f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1613" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Cada página se renderiza por petición para que Next.js aplique el nonce de la CSP.
  await connection();

  return (
    <html lang="es-CO" className={`${atkinson.variable} ${bricolage.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster position="top-center" />
        <RegistrarSW />
      </body>
    </html>
  );
}
