const PESOS = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** 1800000 → "$ 1.800.000" (con espacio fino que no se parte). */
export function formatoPesos(valor: number) {
  return PESOS.format(valor);
}

/** Lee lo que escribe la persona ("1.800.000", "$1800000", "1 800 000") como pesos enteros. */
export function leerPesos(texto: string) {
  // Los centavos ("1.800.000,00") no cuentan: el canon va en pesos enteros.
  const digitos = texto.replace(/,\d{1,2}\s*$/, "").replace(/[^\d]/g, "");
  return digitos ? Number(digitos) : Number.NaN;
}
