import { describe, expect, it } from "vitest";
import {
  diasDeAtraso,
  hoyEnColombia,
  nombrePeriodo,
  proximoPago,
  puntualidad,
  type PagoConFechas,
} from "./pagos";

const pago = (cambios: Partial<PagoConFechas> = {}): PagoConFechas => ({
  estado: "pendiente",
  fecha_limite: "2026-11-05",
  fecha_pago: null,
  ...cambios,
});

describe("puntualidad", () => {
  it("sin pagar y antes de la fecha límite está pendiente", () => {
    expect(puntualidad(pago(), "2026-11-04")).toBe("pendiente");
  });

  it("el mismo día de la fecha límite todavía no está vencido", () => {
    expect(puntualidad(pago(), "2026-11-05")).toBe("pendiente");
  });

  it("sin pagar al día siguiente de la fecha límite está vencido", () => {
    expect(puntualidad(pago(), "2026-11-06")).toBe("vencido");
  });

  it("pagado el día de la fecha límite está a tiempo", () => {
    expect(puntualidad(pago({ estado: "confirmado", fecha_pago: "2026-11-05" }), "2026-12-01")).toBe(
      "a_tiempo",
    );
  });

  it("pagado un día después de la fecha límite está con atraso", () => {
    expect(puntualidad(pago({ estado: "confirmado", fecha_pago: "2026-11-06" }), "2026-11-06")).toBe(
      "con_atraso",
    );
  });

  it("un pago reportado cuenta con su fecha mientras el arrendador lo confirma", () => {
    expect(puntualidad(pago({ estado: "reportado", fecha_pago: "2026-11-03" }), "2026-11-10")).toBe(
      "a_tiempo",
    );
  });

  it("un pago rechazado cuenta como no pagado", () => {
    expect(puntualidad(pago({ estado: "rechazado", fecha_pago: "2026-11-03" }), "2026-11-10")).toBe(
      "vencido",
    );
  });

  it("cruza bien el fin de año", () => {
    const diciembre = pago({ fecha_limite: "2026-12-31" });
    expect(puntualidad(diciembre, "2026-12-31")).toBe("pendiente");
    expect(puntualidad(diciembre, "2027-01-01")).toBe("vencido");
  });

  it("respeta el 29 de febrero de un año bisiesto", () => {
    const febrero = pago({ fecha_limite: "2028-02-29" });
    expect(puntualidad(febrero, "2028-02-29")).toBe("pendiente");
    expect(puntualidad(febrero, "2028-03-01")).toBe("vencido");
  });
});

describe("diasDeAtraso", () => {
  it("cuenta hasta el pago si se pagó tarde", () => {
    expect(diasDeAtraso(pago({ estado: "confirmado", fecha_pago: "2026-11-08" }), "2026-12-01")).toBe(3);
  });

  it("cuenta hasta hoy si está vencido, también cruzando de mes", () => {
    expect(diasDeAtraso(pago({ fecha_limite: "2026-10-31" }), "2026-11-02")).toBe(2);
  });

  it("es cero si está a tiempo o pendiente", () => {
    expect(diasDeAtraso(pago(), "2026-11-01")).toBe(0);
    expect(diasDeAtraso(pago({ estado: "confirmado", fecha_pago: "2026-11-01" }), "2026-11-20")).toBe(0);
  });
});

describe("hoyEnColombia", () => {
  it("usa la hora de Colombia (UTC−5), no la del servidor", () => {
    // 2 de noviembre a las 03:00 UTC todavía es 1 de noviembre en Bogotá.
    expect(hoyEnColombia(new Date("2026-11-02T03:00:00Z"))).toBe("2026-11-01");
    expect(hoyEnColombia(new Date("2026-11-02T05:00:00Z"))).toBe("2026-11-02");
  });
});

describe("proximoPago", () => {
  it("es el primero sin pagar por fecha límite", () => {
    const pagos = [
      pago({ fecha_limite: "2026-12-05" }),
      pago({ fecha_limite: "2026-10-05", estado: "confirmado", fecha_pago: "2026-10-01" }),
      pago({ fecha_limite: "2026-11-05" }),
    ];
    expect(proximoPago(pagos)?.fecha_limite).toBe("2026-11-05");
  });

  it("no hay próximo pago si todo está pagado", () => {
    expect(proximoPago([pago({ estado: "confirmado", fecha_pago: "2026-11-01" })])).toBeUndefined();
  });
});

describe("nombrePeriodo", () => {
  it("muestra el mes en español", () => {
    expect(nombrePeriodo("2026-08-01")).toBe("agosto de 2026");
  });
});
