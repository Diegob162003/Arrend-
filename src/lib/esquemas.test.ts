import { describe, expect, it } from "vitest";
import { bienvenidaSchema, codigoSchema, correoSchema, rolABanderas, rutaSegura } from "./esquemas";

describe("rutaSegura", () => {
  it("acepta rutas internas", () => {
    expect(rutaSegura("/inicio")).toBe("/inicio");
    expect(rutaSegura("/p/abc?x=1")).toBe("/p/abc?x=1");
  });

  it.each([null, undefined, "", "https://malo.com", "//malo.com", "/\\malo.com", "javascript:alert(1)"])(
    "rechaza %s y vuelve al panel",
    (ruta) => {
      expect(rutaSegura(ruta)).toBe("/inicio");
    },
  );
});

describe("rolABanderas", () => {
  it("traduce cada rol a las dos banderas", () => {
    expect(rolABanderas("arrendador")).toEqual({ es_arrendador: true, es_inquilino: false });
    expect(rolABanderas("inquilino")).toEqual({ es_arrendador: false, es_inquilino: true });
    expect(rolABanderas("ambos")).toEqual({ es_arrendador: true, es_inquilino: true });
  });
});

describe("correoSchema", () => {
  it("normaliza el correo", () => {
    expect(correoSchema.parse({ correo: "  Ana@Correo.COM " }).correo).toBe("ana@correo.com");
  });

  it("explica qué falta", () => {
    const r = correoSchema.safeParse({ correo: "ana" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toMatch(/no parece válido/);
  });
});

describe("codigoSchema", () => {
  it("exige exactamente 6 números", () => {
    expect(codigoSchema.safeParse({ codigo: "123456" }).success).toBe(true);
    expect(codigoSchema.safeParse({ codigo: "12345" }).success).toBe(false);
    expect(codigoSchema.safeParse({ codigo: "12345a" }).success).toBe(false);
  });
});

describe("bienvenidaSchema", () => {
  it("exige aceptar el tratamiento de datos", () => {
    const r = bienvenidaSchema.safeParse({ nombre: "Ana", rol: "inquilino", aceptoDatos: false });
    expect(r.success).toBe(false);
  });

  it("acepta un registro completo", () => {
    const r = bienvenidaSchema.safeParse({ nombre: " Ana Gómez ", rol: "ambos", aceptoDatos: true });
    expect(r.success && r.data.nombre).toBe("Ana Gómez");
  });
});
