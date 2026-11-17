import { describe, expect, it } from "vitest";
import {
  duracionMeses,
  errorArchivoFirmado,
  fechaFin,
  nombreArchivoContrato,
  pasoClausulasSchema,
  pasoDatosSchema,
  pasoGarantiaSchema,
  revisarClausulas,
} from "./contrato";
import { pesosEnLetras } from "./numero-en-letras";
import { plantillaContrato } from "./plantilla-contrato";

describe("depósito en dinero (Ley 820, art. 16)", () => {
  it("no se puede elegir como garantía", () => {
    const r = pasoGarantiaSchema.safeParse({ garantia: "deposito" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toMatch(/art\. 16/);
  });

  it.each([
    "El arrendatario entrega un depósito de dos cánones.",
    "Se constituye hipoteca sobre la casa del codeudor.",
    "Deja un DEPOSITO de $500.000",
  ])("no se puede pactar en las cláusulas: %s", (texto) => {
    expect(pasoClausulasSchema.safeParse({ clausulasAdicionales: texto }).success).toBe(false);
  });

  it("acepta las garantías permitidas", () => {
    for (const garantia of ["codeudor", "poliza", "servicios_publicos", "ninguna"]) {
      expect(pasoGarantiaSchema.safeParse({ garantia }).success).toBe(true);
    }
  });
});

describe("revisarClausulas", () => {
  it("avisa, sin bloquear, de un incremento con porcentaje fijo", () => {
    expect(revisarClausulas("El canon tendrá un incremento del 10 % cada año.")).toEqual([
      expect.objectContaining({ nivel: "aviso" }),
    ]);
    expect(pasoClausulasSchema.safeParse({ clausulasAdicionales: "Incremento del 5% anual." }).success).toBe(
      true,
    );
  });

  it("no encuentra nada en un acuerdo normal", () => {
    expect(revisarClausulas("Se permite una mascota pequeña.")).toEqual([]);
  });
});

describe("fechas del contrato", () => {
  it("termina el día antes del aniversario", () => {
    expect(fechaFin("2026-12-01", 12)).toBe("2027-11-30");
    expect(fechaFin("2026-08-15", 6)).toBe("2027-02-14");
  });

  it("calcula la duración a partir de las fechas guardadas", () => {
    expect(duracionMeses("2026-12-01", "2027-11-30")).toBe(12);
    expect(duracionMeses("2026-08-15", "2027-02-14")).toBe(6);
  });
});

describe("pasoDatosSchema", () => {
  const valido = {
    inquilinoNombre: "Beto Gómez",
    inquilinoCorreo: "",
    fechaInicio: "2026-12-01",
    duracionMeses: 12,
    canon: 1800000,
    diaPago: 5,
  };

  it("el correo del inquilino es opcional", () => {
    const r = pasoDatosSchema.safeParse(valido);
    expect(r.success && r.data.inquilinoCorreo).toBeNull();
  });

  it("rechaza un día de pago fuera del mes", () => {
    expect(pasoDatosSchema.safeParse({ ...valido, diaPago: 32 }).success).toBe(false);
  });
});

describe("pesosEnLetras", () => {
  it.each([
    [1800000, "un millón ochocientos mil pesos"],
    [2000000, "dos millones de pesos"],
    [1250500, "un millón doscientos cincuenta mil quinientos pesos"],
    [21000000, "veintiún millones de pesos"],
    [951000, "novecientos cincuenta y un mil pesos"],
    [100000, "cien mil pesos"],
    [1001, "mil un pesos"],
  ])("%i → %s", (valor, texto) => {
    expect(pesosEnLetras(valor)).toBe(texto);
  });
});

describe("plantillaContrato", () => {
  const contrato = plantillaContrato({
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
    clausulasAdicionales: null,
  });
  const texto = contrato.clausulas.flatMap((c) => c.texto).join(" ");

  it("incluye las partes, el canon en letras y las fechas", () => {
    expect(contrato.encabezado).toContain("Ana Rojas");
    expect(texto).toContain("UN MILLÓN OCHOCIENTOS MIL PESOS");
    expect(texto).toContain("desde el 01/08/2026 hasta el 31/07/2027");
  });

  it("deja claro que no hay depósito y limita el incremento al IPC", () => {
    expect(texto).toContain("no exige depósitos en dinero");
    expect(texto).toMatch(/IPC/);
  });

  it("numera las cláusulas en orden", () => {
    expect(contrato.clausulas[0].titulo).toBe("Primera. Objeto");
    expect(contrato.clausulas.at(-1)?.titulo).toBe("Undécima. Datos personales");
  });

  it("deja espacio para que firmen las partes y el codeudor", () => {
    expect(contrato.firmas.map((f) => f.papel)).toEqual(["El arrendador", "El arrendatario", "El codeudor"]);
    expect(contrato.firmas[1].nombre).toBe("Beto Gómez");
    expect(contrato.cierre).toContain("en Bogotá");
  });
});

describe("archivos del contrato", () => {
  it("nombra el PDF a partir de la dirección, sin tildes ni símbolos", () => {
    expect(nombreArchivoContrato("Calle 57 # 9-30, apto 402")).toBe("contrato-calle-57-9-30-apto-402.pdf");
    expect(nombreArchivoContrato("Vía Engativá Nº 3")).toBe("contrato-via-engativa-n-3.pdf");
    expect(nombreArchivoContrato("###")).toBe("contrato-arriendo.pdf");
  });

  it("solo acepta el firmado en PDF y de hasta 10 MB", () => {
    expect(errorArchivoFirmado({ type: "application/pdf", size: 2_000_000 })).toBeNull();
    expect(errorArchivoFirmado({ type: "image/jpeg", size: 2_000_000 })).toMatch(/PDF/);
    expect(errorArchivoFirmado({ type: "application/pdf", size: 11 * 1024 * 1024 })).toMatch(/10 MB/);
  });
});
