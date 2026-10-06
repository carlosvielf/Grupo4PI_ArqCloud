import { test, expect } from "@playwright/test";
const fixture = {
  talhoes: [{ codigo: "REAL01", nome: "Área real" }],
  imagens: [
    {
      id: "img1",
      talhao: "REAL01",
      data: "2026-09-25",
      tipo: "ndvi",
      satelite: "Sentinel-2",
      url: "/demo/field-1-0.svg",
    },
  ],
  leituras: [{ talhao: "REAL01", data: "2026-09-25", ndvi: 0.82 }],
  alertas: [],
  telemetria: [],
};
test("campos opcionais não são inventados", async ({ page }) => {
  await page.route("**/api/*", (route) => {
    const key = new URL(route.request().url()).pathname
      .split("/")
      .at(-1) as keyof typeof fixture;
    return route.fulfill({
      json:
        key === "telemetria"
          ? [{ maquina: "M10", data: "2026-09-25T16:00:00-03:00" }]
          : key === "imagens"
            ? [
                {
                  id: "img1",
                  talhao: "REAL01",
                  data: "2026-09-25",
                  tipo: "ndvi",
                  satelite: "Sentinel-2",
                },
              ]
            : (fixture[key] ?? []),
    });
  });
  await page.goto("/");
  await expect(page.locator(".metric-value").nth(3)).toHaveText("—");
  await page.goto("/maquinas");
  await expect(
    page.getByText("Status indisponível", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".machine-metrics dd")).toHaveCount(0);
  await page.goto("/imagens");
  await expect(
    page.getByText("Imagem não disponível", { exact: true }),
  ).toBeVisible();
});
test("modo API usa somente respostas e não expõe campos internos", async ({
  page,
}) => {
  const requests: string[] = [];
  await page.route("**/api/*", (route) => {
    const key = new URL(route.request().url()).pathname
      .split("/")
      .at(-1) as keyof typeof fixture;
    requests.push(key);
    return route.fulfill({ json: fixture[key] ?? [] });
  });
  await page.goto("/");
  await expect(page.locator(".metric-value").first()).toHaveText("1");
  await expect(
    page.getByRole("link", { name: "REAL01", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Demonstração", { exact: true })).toHaveCount(0);
  expect(requests.sort()).toEqual([
    "alertas",
    "imagens",
    "leituras",
    "talhoes",
    "telemetria",
  ]);
  await page.goto("/imagens");
  await page.locator(".image-card").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Comparar capturas" }),
  ).toBeDisabled();
});
test("API vazia e recurso com falha, sem fallback para mock", async ({
  page,
}) => {
  await page.route("**/api/*", (route) =>
    new URL(route.request().url()).pathname.endsWith("/alertas")
      ? route.fulfill({ status: 503, json: { error: "unavailable" } })
      : route.fulfill({ json: [] }),
  );
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("HTTP 503");
  await expect(page.locator(".metric-value").first()).toHaveText("0");
  await expect(page.locator(".metric-value").nth(2)).toHaveText("—");
  await page.getByRole("link", { name: "Talhões", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Nenhum talhão encontrado" }),
  ).toBeVisible();
  await page.goto("/imagens");
  await expect(
    page.getByRole("heading", { name: "Nenhuma imagem neste período" }),
  ).toBeVisible();
});
test("contrato inválido e recuperação ao atualizar", async ({ page }) => {
  let valid = false;
  await page.route("**/api/*", (route) => {
    const key = new URL(route.request().url()).pathname
      .split("/")
      .at(-1) as keyof typeof fixture;
    return route.fulfill({
      json:
        key === "leituras" && !valid
          ? [{ talhao: "REAL01", data: "2026-09-25", ndvi: 9 }]
          : (fixture[key] ?? []),
    });
  });
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("NDVI ausente ou fora");
  valid = true;
  await page
    .getByRole("button", { name: "Tentar novamente", exact: true })
    .click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator(".talhao-value strong").first()).toHaveText("0,82");
});
