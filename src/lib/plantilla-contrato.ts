import { formatoFecha, type Garantia } from "./contrato";
import { NOMBRE_TIPO_INMUEBLE } from "./esquemas";
import { formatoPesos } from "./formato";
import { pesosEnLetras } from "./numero-en-letras";

export type DatosContrato = {
  arrendadorNombre: string;
  inquilinoNombre: string;
  direccion: string;
  ciudad: string;
  tipo: keyof typeof NOMBRE_TIPO_INMUEBLE;
  fechaInicio: string;
  fechaFin: string;
  duracionMeses: number;
  canon: number;
  diaPago: number;
  garantia: Garantia;
  clausulasAdicionales: string | null;
};

export type Clausula = { titulo: string; texto: string[] };

const ORDINALES = [
  "Primera",
  "Segunda",
  "Tercera",
  "Cuarta",
  "Quinta",
  "Sexta",
  "Séptima",
  "Octava",
  "Novena",
  "Décima",
  "Undécima",
  "Duodécima",
  "Decimotercera",
];

const TEXTO_GARANTIA: Record<Garantia, string> = {
  codeudor:
    "Para garantizar el cumplimiento de las obligaciones de este contrato, el ARRENDATARIO presenta un codeudor, quien firma este documento y responde solidariamente con él.",
  poliza:
    "Para garantizar el pago del canon, el ARRENDATARIO se compromete a mantener vigente una póliza de arrendamiento expedida por una aseguradora, durante todo el contrato y sus prórrogas.",
  servicios_publicos:
    "Para garantizar el pago de los servicios públicos, las partes constituyen la garantía de que trata el artículo 15 de la Ley 820 de 2003.",
  ninguna: "Las partes acuerdan no exigir garantía para este contrato.",
};

/**
 * Texto del contrato de vivienda urbana (Ley 820 de 2003).
 * Borrador pendiente de revisión por un abogado antes de usarlo con clientes reales.
 */
export function plantillaContrato(datos: DatosContrato) {
  const canon = `${pesosEnLetras(datos.canon).toUpperCase()} (${formatoPesos(datos.canon)})`;
  const meses = datos.duracionMeses === 1 ? "un (1) mes" : `${datos.duracionMeses} meses`;

  const clausulas: { nombre: string; texto: string[] }[] = [
    {
      nombre: "Objeto",
      texto: [
        `El ARRENDADOR entrega al ARRENDATARIO, a título de arrendamiento, el inmueble (${NOMBRE_TIPO_INMUEBLE[datos.tipo].toLowerCase()}) ubicado en ${datos.direccion}, ${datos.ciudad}, en el estado que describe el acta de inventario que las partes firman al momento de la entrega.`,
      ],
    },
    {
      nombre: "Destinación",
      texto: [
        "El inmueble se destina exclusivamente a vivienda del ARRENDATARIO y su familia. El ARRENDATARIO no podrá cambiar esta destinación, subarrendar ni ceder el contrato sin autorización escrita del ARRENDADOR.",
      ],
    },
    {
      nombre: "Término",
      texto: [
        `El contrato dura ${meses}, desde el ${formatoFecha(datos.fechaInicio)} hasta el ${formatoFecha(datos.fechaFin)}.`,
        "Al vencer, se prorroga automáticamente por un término igual al inicial, siempre que cada parte haya cumplido sus obligaciones y el ARRENDATARIO acepte el reajuste del canon (Ley 820 de 2003, art. 6).",
      ],
    },
    {
      nombre: "Canon y forma de pago",
      texto: [
        `El canon mensual es de ${canon}, que el ARRENDATARIO pagará por anticipado a más tardar el día ${datos.diaPago} de cada mes. Si el mes no tiene ese día, el pago vence el último día del mes.`,
        "Cada pago se registra en Arrendú, donde el ARRENDADOR lo confirma y queda el recibo correspondiente.",
      ],
    },
    {
      nombre: "Incremento del canon",
      texto: [
        "Cada vez que se cumplan doce (12) meses de ejecución del contrato, el ARRENDADOR podrá incrementar el canon en una proporción que no supere el ciento por ciento (100 %) del incremento del índice de precios al consumidor (IPC) del año calendario anterior (Ley 820 de 2003, art. 20). El ARRENDADOR avisará el nuevo valor por escrito.",
      ],
    },
    {
      nombre: "Garantía",
      texto: [
        TEXTO_GARANTIA[datos.garantia],
        "Conforme al artículo 16 de la Ley 820 de 2003, el ARRENDADOR no exige depósitos en dinero ni cauciones reales.",
      ],
    },
    {
      nombre: "Servicios públicos",
      texto: [
        "Desde la entrega del inmueble, el pago oportuno de los servicios públicos que use está a cargo del ARRENDATARIO.",
      ],
    },
    {
      nombre: "Reparaciones",
      texto: [
        "Las reparaciones locativas, que se originan en el uso normal del inmueble, están a cargo del ARRENDATARIO. Las reparaciones necesarias para conservar el inmueble en estado de servir están a cargo del ARRENDADOR. Ninguna parte hará mejoras sin acuerdo escrito.",
      ],
    },
    {
      nombre: "Restitución",
      texto: [
        "Al terminar el contrato, el ARRENDATARIO devolverá el inmueble en el estado en que lo recibió según el acta de inventario, salvo el deterioro natural por el uso legítimo. Las partes firmarán un acta de devolución.",
      ],
    },
    {
      nombre: "Terminación",
      texto: [
        "Las partes pueden terminar el contrato de mutuo acuerdo, o de forma unilateral por las causales y con los avisos y condiciones que establecen los artículos 22 a 25 de la Ley 820 de 2003.",
      ],
    },
    {
      nombre: "Datos personales",
      texto: [
        "Las partes autorizan el tratamiento de los datos personales de este contrato para su ejecución, conforme a la Ley 1581 de 2012.",
      ],
    },
  ];

  if (datos.clausulasAdicionales) {
    clausulas.push({
      nombre: "Acuerdos adicionales",
      texto: datos.clausulasAdicionales.split(/\n+/).filter(Boolean),
    });
  }

  return {
    titulo: "Contrato de arrendamiento de vivienda urbana",
    encabezado: `Entre ${datos.arrendadorNombre}, quien en adelante se llama el ARRENDADOR, y ${datos.inquilinoNombre}, quien en adelante se llama el ARRENDATARIO, se celebra el presente contrato de arrendamiento de vivienda urbana, que se rige por la Ley 820 de 2003 y por las siguientes cláusulas:`,
    clausulas: clausulas.map(({ nombre, texto }, i) => ({ titulo: `${ORDINALES[i]}. ${nombre}`, texto })),
  };
}
