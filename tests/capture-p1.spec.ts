import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

const screens = [
  ["/", "Visão geral da propriedade", "tela-1-dashboard.png"],
  ["/talhoes", "Talhões", "tela-2-talhoes.png"],
  ["/imagens", "Imagens de satélite", "tela-3-imagens.png"],
  ["/telemetria", "Telemetria", "tela-4-telemetria.png"],
  ["/alertas", "Central de alertas", "tela-5-alertas.png"],
] as const;

test("captura cinco telas com dados reais do Grupo 4", async ({ page }) => {
  mkdirSync("docs/p1/evidencias", { recursive: true });
  for (const [path, heading, filename] of screens) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await expect(page.getByText("Carregando dados…", { exact: true })).toHaveCount(0);
    await page.screenshot({
      path: `docs/p1/evidencias/${filename}`,
      fullPage: false,
    });
  }
});
