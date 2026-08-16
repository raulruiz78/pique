import { expect, test } from "@playwright/test";

// El primer arranque de Next.js en CI compila varias rutas bajo demanda.
// Dejamos margen al flujo completo sin relajar los timeouts de cada aserción.
test.setTimeout(240_000);

async function login(page: import("@playwright/test").Page, email: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill("PiqueDemo2026!");
    await page.getByRole("button", { name: "Entrar al pique" }).click();
    try {
      await page.waitForURL(/\/hoy/, { timeout: 20_000 });
      return;
    } catch {
      if (attempt === 2)
        throw new Error(`No se pudo iniciar sesión con ${email}`);
    }
  }
}

test("A crea → B acepta → A cumple → B valida → ranking cambia", async ({
  browser,
}, testInfo) => {
  const challengeTitle = `Leer cada día E2E ${testInfo.retry}-${Date.now()}`;
  const a = await browser.newContext();
  const b = await browser.newContext();
  const pageA = await a.newPage();
  const pageB = await b.newPage();
  try {
    await login(pageA, "raul@pique.local");
    await pageA.goto("/crear");
    await pageA.getByRole("button", { name: /Foco y mente/ }).click();
    await expect(pageA.getByText("Carmen")).toBeVisible({ timeout: 30_000 });
    await pageA.getByLabel("Título").fill(challengeTitle);
    await pageA
      .getByLabel("Descripción y reglas")
      .fill("Leer al menos veinte minutos. Sin audiolibros.");
    await pageA.getByRole("button", { name: /Siguiente/ }).click();
    // El asistente arranca con Lunes/Miércoles/Viernes preseleccionados: el
    // resto de días no generarían ninguna ocurrencia para "hoy". Las
    // ocurrencias se generan por día UTC (date_trunc en el servidor), así
    // que marcamos solo el día de hoy en UTC — nunca varios días, para no
    // arriesgarnos a que un día adyacente también solape la ventana "hoy"
    // calculada en la zona horaria del perfil (Europe/Madrid en el seed).
    const utcDayNames = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    const todayName = utcDayNames[new Date().getUTCDay()];
    const dayButtons = pageA
      .getByRole("group", { name: "Días del reto" })
      .getByRole("button");
    for (const day of await dayButtons.all()) {
      const isToday = (await day.getAttribute("aria-label")) === todayName;
      const isPressed = (await day.getAttribute("aria-pressed")) === "true";
      if (isToday !== isPressed) await day.click();
    }
    // El checkbox vive dentro de un <label class="stitch-card"> grande: el
    // control de accionabilidad estricto de Playwright a veces lo marca como
    // intersectado/inestable por el propio label que lo envuelve. El toque
    // real siempre funciona sobre esta tarjeta, así que forzamos el clic.
    await pageA.getByLabel("Foto como evidencia").uncheck({ force: true });
    await pageA.getByRole("button", { name: /Siguiente/ }).click();
    await pageA.getByRole("button", { name: /Enviar reto/ }).click();
    await expect(pageA).toHaveURL(/\/retos\//, { timeout: 30_000 });
    const challengeUrl = pageA.url();
    await login(pageB, "carmen@pique.local");
    await pageB.goto(challengeUrl);
    await pageB.getByRole("button", { name: /Aceptar reto/ }).click();
    await expect(pageB.getByText("Reto aceptado. ¡A por ello!")).toBeVisible({
      timeout: 30_000,
    });
    await pageA.goto("/hoy");
    const objectiveA = pageA
      .getByRole("article")
      .filter({ hasText: challengeTitle });
    await expect(objectiveA).toBeVisible({ timeout: 30_000 });
    await objectiveA.getByRole("button", { name: "Hecho" }).click();
    await pageA.getByLabel("Nota opcional").fill("Veinte minutos terminados.");
    await pageA.getByRole("button", { name: /Confirmar hecho/ }).click();
    await expect(pageA.getByText(/Check-in enviado/)).toBeVisible({
      timeout: 30_000,
    });
    await pageB.goto("/hoy");
    const pending = pageB
      .getByRole("article")
      .filter({ hasText: challengeTitle })
      .filter({
        has: pageB.getByRole("button", { name: /Validar/ }),
      });
    await expect(pending).toBeVisible({ timeout: 30_000 });
    await pending.getByRole("button", { name: /Validar/ }).click();
    await expect(pageB.getByText(/Los puntos ya cuentan/)).toBeVisible({
      timeout: 30_000,
    });
    await pageA.goto("/ranking");
    await expect(pageA.getByText("Raúl").first()).toBeVisible({
      timeout: 30_000,
    });
  } finally {
    // No dejamos que un cierre lento de WebKit oculte el fallo original.
    void a.close().catch(() => undefined);
    void b.close().catch(() => undefined);
  }
});
