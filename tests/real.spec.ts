import { expect, test } from "@playwright/test";

test("dashboard e todas as páginas consomem o backend real do Grupo 4", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Visão geral da propriedade" })).toBeVisible();
  await expect(page.locator(".metric-value").first()).toHaveText("6");
  await expect(page.locator(".metric-value").nth(1)).toHaveText("48");
  await expect(page.getByText("Demonstração", { exact: true })).toHaveCount(0);
  for (const path of [
    "/talhoes",
    "/talhoes/T01",
    "/imagens",
    "/analises",
    "/alertas",
    "/maquinas",
    "/telemetria",
    "/configuracoes",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByText("Não foi possível carregar", { exact: false })).toHaveCount(0);
  }
  await page.goto("/imagens");
  await expect(page.locator(".image-card img").first()).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".image-card img")
        .first()
        .evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
