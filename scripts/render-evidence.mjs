import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  for (const name of ["arquitetura-atual", "arquitetura-proposta"]) {
    const svg = await readFile(`docs/p1/evidencias/${name}.svg`, "utf8");
    await page.setContent(svg);
    await page.locator("svg").screenshot({ path: `docs/p1/evidencias/${name}.png` });
  }
} finally {
  await browser.close();
}
