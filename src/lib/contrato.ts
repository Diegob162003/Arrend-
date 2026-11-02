import { z } from "zod";

// ---------------------------------------------------------------------------
// Cláusulas que la ley no permite en vivienda urbana
// ---------------------------------------------------------------------------

export type Hallazgo = { nivel: "error" | "aviso"; mensaje: string };

const REGLAS: { patron: RegExp; hallazgo: Hallazgo }[] = [
  {
    patron: /dep[oó]sito|cauci[oó]n(es)? real(es)?|hipoteca|prenda/i,
    hallazgo: {
      nivel: "error",
      mensaje:
        "En vivienda no se puede pedir depósito en dinero ni garantías como hipoteca o prenda (Ley 820 de 2003, art. 16). Usa codeudor, póliza o la garantía de servicios públicos.",
    },
  },
  {
    patron: /(incremento|aumento|reajuste)[^.]*\d+([.,]\d+)?\s*%/i,
    hallazgo: {
      nivel: "aviso",
      mensaje:
        "El incremento anual no puede superar el IPC del año anterior (Ley 820 de 2003, art. 20). Si pones un porcentaje fijo, revisa que no lo supere.",
    },
  },
];

/** Revisa el texto libre del contrato y explica lo que no se puede o conviene revisar. */
export function revisarClausulas(texto: string): Hallazgo[] {
  return REGLAS.filter(({ patron }) => patron.test(texto)).map(({ hallazgo }) => hallazgo);
}

// ---------------------------------------------------------------------------
// Fechas
// ---------------------------------------------------------------------------

/** "2026-12-01" + 12 meses → "2027-11-30": el contrato termina el día antes del aniversario. */
export function fechaFin(inicio: string, meses: number) {
  const [anio, mes, dia] = inicio.split("-").map(Number);
  const fin = new Date(Date.UTC(anio, mes - 1 + meses, dia));
  // Si el día no existe en el mes de llegada (31 de febrero), se queda en el último día de ese mes.
  if (fin.getUTCDate() !== dia) fin.setUTCDate(0);
  fin.setUTCDate(fin.getUTCDate() - 1);
  return fin.toISOString().slice(0, 10);
}

/** Meses completos entre el inicio y el fin guardados (inverso de fechaFin). */
export function duracionMeses(inicio: string, fin: string) {
  const [a1, m1] = inicio.split("-").map(Number);
  const siguiente = new Date(`${fin}T00:00:00Z`);
  siguiente.setUTCDate(siguiente.getUTCDate() + 1);
  return (siguiente.getUTCFullYear() - a1) * 12 + (siguiente.getUTCMonth() + 1 - m1);
}

export function formatoFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

// ---------------------------------------------------------------------------
// Garantías
// ---------------------------------------------------------------------------

export const GARANTIAS = ["codeudor", "poliza", "servicios_publicos", "ninguna"] as const;
export type Garantia = (typeof GARANTIAS)[number];

export const NOMBRE_GARANTIA: Record<Garantia, { titulo: string; detalle: string }> = {
  codeudor: {
    titulo: "Codeudor",
    detalle: "Una persona responde por el canon si el inquilino no paga.",
  },
  poliza: {
    titulo: "Póliza de arrendamiento",
    detalle: "Una aseguradora estudia al inquilino y cubre el canon si deja de pagar.",
  },
  servicios_publicos: {
    titulo: "Garantía de servicios públicos",
    detalle: "Protege al arrendador de las deudas de servicios que deje el inquilino (Ley 820, art. 15).",
  },
  ninguna: {
    titulo: "Sin garantía",
    detalle: "El contrato no exige garantía.",
  },
};

// ---------------------------------------------------------------------------
// Esquemas de cada paso
// ---------------------------------------------------------------------------

export const pasoDatosSchema = z.object({
  inquilinoNombre: z
    .string()
    .trim()
    .min(2, "Escribe el nombre completo del inquilino.")
    .max(120, "El nombre es muy largo."),
  inquilinoCorreo: z
    .string()
    .trim()
    .toLowerCase()
    .transform((correo) => correo || null)
    .pipe(z.email("Ese correo no parece válido.").nullable()),
  fechaInicio: z.iso
    .date("Elige la fecha en que empieza el arriendo.")
    .refine(
      (fecha) => fecha >= new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10),
      "La fecha de inicio no puede ser de hace más de un año.",
    ),
  duracionMeses: z
    .number("Escribe cuántos meses dura el contrato.")
    .int("Usa meses completos.")
    .min(1, "El contrato dura al menos un mes.")
    .max(60, "Para más de 5 años, consulta con un abogado."),
  canon: z
    .number("Escribe el canon en pesos, solo números.")
    .int()
    .min(50_000, "El canon debe ser de al menos $ 50.000.")
    .max(1_000_000_000, "Revisa el canon: parece demasiado alto."),
  diaPago: z
    .number("Elige el día del mes en que se paga.")
    .int()
    .min(1, "El día de pago va del 1 al 31.")
    .max(31, "El día de pago va del 1 al 31."),
});

export const pasoGarantiaSchema = z.object({
  garantia: z
    .string()
    .superRefine((valor, ctx) => {
      if (/dep[oó]sito/i.test(valor)) {
        ctx.addIssue({
          code: "custom",
          message: "La ley no permite pedir depósito en dinero en vivienda (Ley 820 de 2003, art. 16).",
        });
      } else if (!(GARANTIAS as readonly string[]).includes(valor)) {
        ctx.addIssue({ code: "custom", message: "Elige una de las garantías." });
      }
    })
    .transform((valor) => valor as Garantia),
});

export const pasoClausulasSchema = z.object({
  clausulasAdicionales: z
    .string()
    .trim()
    .max(2000, "Las cláusulas adicionales pueden tener hasta 2.000 caracteres.")
    .superRefine((texto, ctx) => {
      for (const hallazgo of revisarClausulas(texto)) {
        if (hallazgo.nivel === "error") ctx.addIssue({ code: "custom", message: hallazgo.mensaje });
      }
    })
    .transform((texto) => texto || null),
});

// ---------------------------------------------------------------------------
// Archivos
// ---------------------------------------------------------------------------

/** "Calle 57 # 9-30, apto 402" → "contrato-calle-57-9-30-apto-402.pdf" */
export function nombreArchivoContrato(direccion: string) {
  const base = direccion
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
    .replace(/-$/, "");
  return `contrato-${base || "arriendo"}.pdf`;
}

/** Tope del bucket de contratos firmados (10 MB). */
export const TAMANO_MAXIMO_FIRMADO = 10 * 1024 * 1024;

/** Revisa el archivo antes de subirlo; el bucket aplica las mismas reglas. */
export function errorArchivoFirmado(archivo: { type: string; size: number }) {
  if (archivo.type !== "application/pdf") {
    return "Sube el contrato en PDF. Si lo tienes en papel, escanéalo con la app de Google Drive o la cámara del celular.";
  }
  if (archivo.size > TAMANO_MAXIMO_FIRMADO) return "El PDF pesa más de 10 MB. Escanéalo en menor calidad.";
  return null;
}

/** Ruta del contrato firmado en Storage; la base solo acepta esta. */
export function rutaFirmado(arrendadorId: string, contratoId: string) {
  return `${arrendadorId}/${contratoId}/firmado.pdf`;
}
