import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { plantillaContrato } from "@/lib/plantilla-contrato";
import { ContratoPdf } from "./contrato-pdf";

describe("ContratoPdf", () => {
  it("genera un PDF tamaño carta con el contrato", async () => {
    const texto = plantillaContrato({
      arrendadorNombre: "Ana Rojas",
      inquilinoNombre: "Beto Gómez",
      direccion: "Calle 57 # 9-30, apto 402",
      ciudad: "Bogotá",
      tipo: "apartamento",
      fechaInicio: "2026-08-01",
      fechaFin: "2027-07-31",
      duracionMeses: 12,
      canon: 1800000,
      diaPago: 5,
      garantia: "codeudor",
      clausulasAdicionales: "Se permite una mascota pequeña.",
    });
    const pdf = (await renderToBuffer(<ContratoPdf contrato={texto} referencia="20000000" />)).toString(
      "latin1",
    );

    expect(pdf.startsWith("%PDF-")).toBe(true);
    // Carta: 612 × 792 puntos. El texto completo ocupa más de una página.
    expect(pdf).toContain("/MediaBox [0 0 612 792]");
    expect(Number(pdf.match(/\/Count (\d+)/)?.[1])).toBeGreaterThan(1);
  }, 20_000);
});
