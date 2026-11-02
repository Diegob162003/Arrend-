import { describe, expect, it } from "vitest";
import { formatoPesos, leerPesos } from "./formato";
import { inmuebleSchema } from "./esquemas";
import { partirDireccion, situacionInmueble } from "@/app/inmuebles/direccion";

describe("leerPesos", () => {
  it.each([
    ["1.800.000", 1800000],
    ["$1800000", 1800000],
    ["1 800 000", 1800000],
    ["1.800.000,00", 1800000],
  ])("lee %s", (texto, valor) => {
    expect(leerPesos(texto)).toBe(valor);
  });

  it("devuelve NaN si no hay números", () => {
    expect(leerPesos("")).toBeNaN();
  });
});

describe("formatoPesos", () => {
  it("usa puntos de miles y sin decimales", () => {
    expect(formatoPesos(1800000).replace(/\s/g, " ")).toBe("$ 1.800.000");
  });
});

describe("inmuebleSchema", () => {
  const valido = {
    direccion: "Calle 57 # 9-30",
    ciudad: "Bogotá",
    tipo: "casa",
    canonBase: 1800000,
    notas: "",
  };

  it("acepta un inmueble completo y convierte las notas vacías en null", () => {
    const r = inmuebleSchema.safeParse(valido);
    expect(r.success && r.data.notas).toBeNull();
  });

  it("rechaza un canon que no es un número", () => {
    expect(inmuebleSchema.safeParse({ ...valido, canonBase: Number.NaN }).success).toBe(false);
  });

  it("rechaza un tipo que no existe", () => {
    expect(inmuebleSchema.safeParse({ ...valido, tipo: "castillo" }).success).toBe(false);
  });
});

describe("partirDireccion", () => {
  it("separa la nomenclatura del apartamento", () => {
    expect(partirDireccion("Calle 57 # 9-30, apto 402")).toEqual({
      via: "Calle 57 # 9-30",
      resto: "apto 402",
    });
    expect(partirDireccion("Carrera 7 # 12-45")).toEqual({ via: "Carrera 7 # 12-45", resto: "" });
  });
});

describe("situacionInmueble", () => {
  it("prioriza el contrato activo", () => {
    expect(situacionInmueble([{ estado: "borrador" }, { estado: "activo" }])).toBe("arrendado");
    expect(situacionInmueble([{ estado: "borrador" }])).toBe("borrador");
    expect(situacionInmueble([{ estado: "terminado" }])).toBe("disponible");
  });
});
