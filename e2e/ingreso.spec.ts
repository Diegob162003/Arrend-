import { expect, test } from "@playwright/test";

// Mailpit de Supabase local recibe los correos de ingreso.
const MAILPIT = "http://127.0.0.1:54324";

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

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL("/");
});
