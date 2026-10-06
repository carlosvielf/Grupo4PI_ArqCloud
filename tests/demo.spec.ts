import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
test("rotas, métricas e console", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Visão geral da propriedade" }),
  ).toBeVisible();
  await expect(
    page.getByText("Dados e imagens ilustrativos.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.locator(".metric-card").first().locator(".metric-value"),
  ).toHaveText("6");
  await expect(
    page.locator(".metric-card").nth(1).locator(".metric-value"),
  ).toHaveText("48");
  for (const [path, title] of [
    ["/talhoes", "Talhões"],
    ["/imagens", "Imagens de satélite"],
    ["/analises", "Análises da vegetação"],
    ["/maquinas", "Máquinas"],
    ["/telemetria", "Telemetria"],
    ["/alertas", "Central de alertas"],
    ["/configuracoes", "Configurações da operação"],
  ]) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
  }
  expect(errors).toEqual([]);
});
test("busca, filtros e paginação de imagens", async ({ page }) => {
  await page.goto("/talhoes?q=T04");
  await expect(page.locator(".talhao-card")).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "T04", exact: true }),
  ).toBeVisible();
  await page.goto("/talhoes?status=normal");
  await expect(page.locator(".talhao-card")).toHaveCount(4);
  await page.goto("/imagens");
  await expect(page.locator(".image-card")).toHaveCount(12);
  await page.getByRole("button", { name: "Próxima" }).click();
  await expect(page.getByText("Página 2 de 4")).toBeVisible();
  await page.getByLabel("Talhão", { exact: true }).selectOption("T01");
  await expect(page.locator(".image-card")).toHaveCount(8);
  await expect(page).toHaveURL(/talhao=T01/);
});
test("timeline, comparação e modal acessível", async ({ page }) => {
  await page.goto("/talhoes/T01");
  await expect(
    page.getByRole("heading", { name: "Talhão T01", exact: true }),
  ).toBeVisible();
  await page.locator(".date-timeline button").first().click();
  await expect(page.locator(".timeline-info h3")).toContainText("jun");
  await expect(page.locator(".date-timeline button").first()).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("slider").fill("75");
  await expect(page.locator(".comparison-overlay").first()).toHaveAttribute(
    "style",
    /25%/,
  );
  await page.locator(".image-card").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Comparar capturas" }).click();
  await expect(page.getByRole("dialog").getByRole("slider")).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".image-card").first()).toBeFocused();
});
test("alertas filtrados, detalhes e estado vazio", async ({ page }) => {
  await page.goto("/alertas");
  await page.getByRole("button", { name: /Críticos/ }).click();
  await expect(page.locator(".alert-item")).toHaveCount(1);
  await page.getByText("Ver informações", { exact: true }).click();
  await expect(
    page.getByText("A leitura mais recente está abaixo de 0,40.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByRole("searchbox").fill("inexistente");
  await expect(
    page.getByRole("heading", { name: "Nenhum alerta encontrado" }),
  ).toBeVisible();
  await page.goto("/talhoes/inexistente");
  await expect(
    page.getByRole("heading", { name: "Talhão não encontrado" }),
  ).toBeVisible();
});
test("responsividade e revisão visual", async ({ page }) => {
  test.setTimeout(90000);
  mkdirSync("docs/screenshots", { recursive: true });
  for (const width of [1920, 1440, 1366, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Visão geral da propriedade" }),
    ).toBeVisible();
    await expect(page.locator(".recharts-surface").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if ([1440, 768, 390].includes(width))
      await page.screenshot({
        path: `docs/screenshots/dashboard-${width}.png`,
        fullPage: true,
      });
    if (width === 390) {
      await page.getByRole("button", { name: "Abrir menu" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page
        .getByRole("dialog")
        .getByRole("link", { name: /Talhões/ })
        .click();
      await expect(
        page.getByRole("heading", { name: "Talhões", exact: true }),
      ).toBeVisible();
      await expect(page.getByRole("dialog")).not.toBeVisible();
    }
    for (const path of [
      "/talhoes/T01",
      "/imagens",
      "/telemetria",
      "/alertas",
      "/configuracoes",
    ]) {
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
});
test("drawer mobile acessível", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  await page.getByRole("button", { name: "Abrir menu" }).click();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Abrir menu" })).toBeFocused();
});
test("acessibilidade WCAG AA nas páginas principais", async ({ page }) => {
  test.setTimeout(90000);
  for (const path of [
    "/",
    "/talhoes",
    "/imagens",
    "/talhoes/T01",
    "/alertas",
    "/maquinas",
    "/telemetria",
    "/configuracoes",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ).toEqual([]);
  }
});
test("exportar resumo", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".metric-value").first()).toHaveText("6");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar resumo" }).click();
  expect((await download).suggestedFilename()).toBe(
    "Monitora.G4-resumo-demonstracao.csv",
  );
});
