import { expect, test } from "@playwright/test";

// Mailpit de Supabase local recibe los correos de ingreso.
const MAILPIT = "http://127.0.0.1:54324";

// Imagen PNG de 4×4 píxeles en verde tinta para probar la subida de fotos.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEElEQVR4nGPg97GCIwbiOADvpAlRZ1cRnQAAAABJRU5ErkJggg==",
  "base64",
);

async function codigoDelCorreo(correo: string) {
  for (let intento = 0; intento < 20; intento++) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${correo}`)}`);
    const { messages } = (await res.json()) as { messages: { ID: string }[] };
    if (messages?.length) {
      const detalle = await fetch(`${MAILPIT}/api/v1/message/${messages[0].ID}`);
      const { Text, HTML } = (await detalle.json()) as { Text: string; HTML: string };
      const codigo = (Text || HTML).match(/\b\d{6}\b/)?.[0];
      if (codigo) return codigo;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No llegó el correo a ${correo}`);
}

test("la página de inicio responde con encabezados de seguridad", async ({ page }) => {
  const respuesta = await page.goto("/");
  const csp = respuesta?.headers()["content-security-policy"] ?? "";
  expect(csp).toContain("'strict-dynamic'");
  expect(respuesta?.headers()["x-frame-options"]).toBe("DENY");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tu arriendo en orden, sin inmobiliaria.");
});

test("el panel exige haber ingresado", async ({ page }) => {
  await page.goto("/inicio");
  await expect(page).toHaveURL(/\/ingresar$/);
});

test("una persona nueva crea su cuenta con el código del correo", async ({ page }) => {
  const correo = `prueba-${Date.now()}@arrendu.test`;

  await page.goto("/");
  await page.getByRole("link", { name: "Empezar gratis" }).click();
  await page.getByLabel("Correo").fill(correo);
  // Turnstile con la llave de prueba aprueba solo; se espera a que termine.
  await page.waitForFunction(() => {
    const campo = document.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]');
    return Boolean(campo?.value);
  });
  await page.getByRole("button", { name: "Enviarme el código" }).click();

  await page.getByLabel("Código").fill(await codigoDelCorreo(correo));
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/bienvenida$/);
  await page.getByRole("button", { name: "Guardar y continuar" }).click();
  await expect(page.getByText("Escribe tu nombre.")).toBeVisible();

  await page.getByLabel("Tu nombre").fill("Ana Gómez");
  await page.getByText("Las dos cosas").click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Guardar y continuar" }).click();

  await expect(page).toHaveURL(/\/inicio$/);
  await expect(page.getByRole("heading", { name: "Hola, Ana" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tus inmuebles" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tu arriendo" })).toBeVisible();

  // Registra su primer inmueble con una foto.
  await page.getByRole("link", { name: "Agregar inmueble" }).click();
  await page.getByRole("button", { name: "Guardar inmueble" }).click();
  await expect(page.getByText("Elige qué tipo de inmueble es.")).toBeVisible();

  await page.getByLabel("Dirección").fill("Calle 57 # 9-30, apto 402");
  await page.getByLabel("Ciudad o municipio").fill("Bogotá");
  await page.getByText("Apartamento", { exact: true }).click();
  await page.getByLabel("Canon mensual").fill("1800000");
  await page.getByRole("button", { name: "Guardar inmueble" }).click();

  await expect(page.getByRole("heading", { name: "Calle 57 # 9-30" })).toBeVisible();
  await expect(page.getByText("apto 402, Bogotá")).toBeVisible();

  await page
    .getByLabel("Agregar fotos")
    .setInputFiles({ name: "sala.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByRole("img", { name: "Foto 1 del inmueble" })).toBeVisible();

  // Arma el contrato en tres pasos; la ley no deja pactar depósito.
  await page.getByRole("link", { name: "Crear contrato" }).click();
  await page.getByLabel("Nombre completo").fill("Beto Gómez");
  await page.getByRole("button", { name: "Guardar y seguir" }).click();

  await expect(page.getByText("¿Y el depósito?")).toBeVisible();
  await page.getByText("Codeudor", { exact: true }).click();
  await page.getByRole("button", { name: "Guardar y seguir" }).click();

  await page.getByLabel("Acuerdos adicionales (opcional)").fill("Deja un depósito de un mes.");
  await expect(page.getByText(/no se puede pedir depósito en dinero/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar contrato" })).toBeDisabled();

  await page.getByLabel("Acuerdos adicionales (opcional)").fill("Se permite una mascota pequeña.");
  await page.getByRole("button", { name: "Guardar contrato" }).click();
  await expect(page.getByRole("heading", { name: "Contrato con Beto" })).toBeVisible();
  await expect(page.getByText("UN MILLÓN OCHOCIENTOS MIL PESOS", { exact: false })).toBeVisible();
  await expect(page.getByText("Se permite una mascota pequeña.")).toBeVisible();

  await page.getByRole("link", { name: "Calle 57 # 9-30" }).click();
  await page.getByRole("link", { name: "Tus inmuebles" }).click();
  await expect(page.getByText("Contrato en borrador")).toBeVisible();

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL("/");
});
