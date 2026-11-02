const UNIDADES = [
  "",
  "uno",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
  "once",
  "doce",
  "trece",
  "catorce",
  "quince",
  "dieciséis",
  "diecisiete",
  "dieciocho",
  "diecinueve",
  "veinte",
  "veintiuno",
  "veintidós",
  "veintitrés",
  "veinticuatro",
  "veinticinco",
  "veintiséis",
  "veintisiete",
  "veintiocho",
  "veintinueve",
];
const DECENAS = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const CENTENAS = [
  "",
  "ciento",
  "doscientos",
  "trescientos",
  "cuatrocientos",
  "quinientos",
  "seiscientos",
  "setecientos",
  "ochocientos",
  "novecientos",
];

function hastaMil(n: number): string {
  if (n === 100) return "cien";
  const c = Math.floor(n / 100);
  const resto = n % 100;
  let texto = CENTENAS[c];
  if (resto) {
    const decenas =
      resto < 30
        ? UNIDADES[resto]
        : DECENAS[Math.floor(resto / 10)] + (resto % 10 ? ` y ${UNIDADES[resto % 10]}` : "");
    texto = texto ? `${texto} ${decenas}` : decenas;
  }
  return texto;
}

/** "uno" pasa a "un" delante de mil, millón o pesos ("veintiún mil", "un millón"). */
const apocopar = (texto: string) => texto.replace(/veintiuno$/, "veintiún").replace(/(^|\s)uno$/, "$1un");

function enLetras(n: number): string {
  if (n === 0) return "cero";
  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const unidades = n % 1000;
  const partes: string[] = [];

  if (millones) {
    partes.push(millones === 1 ? "un millón" : `${apocopar(enLetras(millones))} millones`);
  }
  if (miles) partes.push(miles === 1 ? "mil" : `${apocopar(hastaMil(miles))} mil`);
  if (unidades) partes.push(hastaMil(unidades));
  return partes.join(" ");
}

/**
 * 1800000 → "un millón ochocientos mil pesos". Como se escribe en los contratos:
 * "de" cuando la cifra termina en millones ("dos millones de pesos").
 */
export function pesosEnLetras(valor: number) {
  const texto = apocopar(enLetras(valor));
  const de = valor % 1_000_000 === 0 && valor >= 1_000_000 ? " de" : "";
  return `${texto}${de} ${valor === 1 ? "peso" : "pesos"}`;
}
