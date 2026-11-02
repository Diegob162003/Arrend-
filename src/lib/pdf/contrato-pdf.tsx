import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { TextoContrato } from "@/lib/plantilla-contrato";

// Helvetica viene incluida en todo lector de PDF y cubre las tildes y la eñe.
// Sin guiones de corte: partir "ARREN-DATARIO" en un contrato se ve descuidado.
Font.registerHyphenationCallback((palabra) => [palabra]);

const estilos = StyleSheet.create({
  pagina: {
    paddingTop: 64,
    paddingBottom: 72,
    paddingHorizontal: 72,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    lineHeight: 1.45,
    color: "#17211d",
  },
  titulo: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: 20,
  },
  parrafo: { marginBottom: 6 },
  clausula: { marginTop: 8 },
  tituloClausula: { fontFamily: "Helvetica-Bold", marginBottom: 2 },
  firmas: { flexDirection: "row", flexWrap: "wrap", marginTop: 48, columnGap: 36, rowGap: 48 },
  firma: { width: 200, borderTopWidth: 0.75, borderTopColor: "#17211d", paddingTop: 4 },
  papel: { fontFamily: "Helvetica-Bold", textTransform: "uppercase", fontSize: 9.5 },
  // El pie es fijo: en @react-pdf/renderer 4.9 un texto con render y posición absoluta no se dibuja.
  pie: { position: "absolute", bottom: 36, left: 72, fontSize: 8, color: "#5b6660" },
});

/** El contrato listo para imprimir y firmar, con el mismo texto que se ve en la app. */
export function ContratoPdf({ contrato, referencia }: { contrato: TextoContrato; referencia: string }) {
  return (
    <Document title={contrato.titulo} author="Arrendú" language="es-CO">
      <Page size="LETTER" style={estilos.pagina}>
        <Text style={estilos.titulo}>{contrato.titulo}</Text>
        <Text style={estilos.parrafo}>{contrato.encabezado}</Text>

        {contrato.clausulas.map((clausula) => (
          <View key={clausula.titulo} style={estilos.clausula} wrap={clausula.texto.length > 1}>
            <Text style={estilos.tituloClausula}>{clausula.titulo}</Text>
            {clausula.texto.map((parrafo) => (
              <Text key={parrafo} style={estilos.parrafo}>
                {parrafo}
              </Text>
            ))}
          </View>
        ))}

        {/* El cierre y las firmas van juntos para que nadie firme una hoja suelta. */}
        <View wrap={false}>
          <Text style={[estilos.parrafo, { marginTop: 16 }]}>{contrato.cierre}</Text>
          <View style={estilos.firmas}>
            {contrato.firmas.map((firma) => (
              <View key={firma.papel} style={estilos.firma}>
                <Text style={estilos.papel}>{firma.papel}</Text>
                <Text>{firma.nombre ?? "Nombre:"}</Text>
                <Text>C.C.</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={estilos.pie} fixed>
          Contrato {referencia} · Hecho con Arrendú
        </Text>
      </Page>
    </Document>
  );
}
