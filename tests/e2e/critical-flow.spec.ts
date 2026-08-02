import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill("PiqueDemo2026!");
  await page.getByRole("button", { name: "Entrar al pique" }).click();
  await expect(page).toHaveURL(/\/hoy/);
}

test("A crea → B acepta → A cumple → B valida → ranking cambia", async ({
  browser,
}) => {
  const a = await browser.newContext();
  const b = await browser.newContext();
  const pageA = await a.newPage();
  const pageB = await b.newPage();
  await login(pageA, "raul@pique.local");
  await pageA.goto("/crear");
  await pageA.getByRole("button", { name: /Leer cada día/ }).click();
  await expect(pageA.getByText("Carmen")).toBeVisible();
  await pageA
    .getByLabel("Descripción y reglas")
    .fill("Leer al menos veinte minutos. Sin audiolibros.");
  await pageA.getByRole("button", { name: /Siguiente/ }).click();
  await pageA.getByLabel("Foto como evidencia").uncheck();
  await pageA.getByRole("button", { name: /Siguiente/ }).click();
  await pageA.getByRole("button", { name: /Enviar reto/ }).click();
  await expect(pageA).toHaveURL(/\/retos\//);
  const challengeUrl = pageA.url();
  await login(pageB, "carmen@pique.local");
  await pageB.goto(challengeUrl);
  await pageB.getByRole("button", { name: /Aceptar reto/ }).click();
  await pageA.goto("/hoy");
  const objectiveA = pageA
    .getByRole("article")
    .filter({ hasText: "Leer cada día" });
  await objectiveA.getByRole("button", { name: "Hecho" }).click();
  await pageA.getByLabel("Nota opcional").fill("Veinte minutos terminados.");
  await pageA.getByRole("button", { name: /Enviar check-in/ }).click();
  await expect(pageA.getByText(/Check-in enviado/)).toBeVisible();
  await pageB.goto("/hoy");
  const pending = pageB
    .getByRole("article")
    .filter({ hasText: "Leer cada día" });
  await pending.getByRole("button", { name: /Validar/ }).click();
  await expect(pageB.getByText(/Los puntos ya cuentan/)).toBeVisible();
  await pageA.goto("/ranking");
  await expect(pageA.getByText("Raúl").first()).toBeVisible();
  await a.close();
  await b.close();
});
