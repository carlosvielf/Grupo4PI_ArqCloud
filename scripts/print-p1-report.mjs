import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(resolve("docs/p1/relatorio-final.html")).href, {
    waitUntil: "networkidle",
  });
  await page.locator(".cover").screenshot({
    path: "docs/p1/evidencias/relatorio-capa-preview.png",
  });
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: "P1_IAL214_Grupo4.pdf",
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    tagged: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: '<div style="width:100%;font-size:8px;color:#66756d;text-align:center"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    margin: { top: "18mm", right: "17mm", bottom: "18mm", left: "20mm" },
  });
} finally {
  await browser.close();
}
