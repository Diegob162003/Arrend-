/** Lado mayor de las fotos guardadas: suficiente para ver detalles y liviano en datos móviles. */
const LADO_MAXIMO = 1600;

/**
 * Vuelve a dibujar la foto en un canvas y la exporta como JPEG. Así se descartan
 * los metadatos EXIF (ubicación GPS, modelo del celular) y se reduce el tamaño.
 */
export async function prepararFoto(archivo: File): Promise<Blob> {
  const imagen = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
  const ancho = Math.round(imagen.width * escala);
  const alto = Math.round(imagen.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const contexto = canvas.getContext("2d");
  if (!contexto) throw new Error("Este navegador no puede procesar la foto.");
  contexto.drawImage(imagen, 0, 0, ancho, alto);
  imagen.close();

  return new Promise((resolver, rechazar) =>
    canvas.toBlob(
      (blob) => (blob ? resolver(blob) : rechazar(new Error("No se pudo convertir la foto."))),
      "image/jpeg",
      0.82,
    ),
  );
}

/** Nombre que ordena las fotos por fecha de subida. */
export function nombreFoto(ahora = Date.now()) {
  return `${ahora}-${crypto.randomUUID().slice(0, 8)}.jpg`;
}
