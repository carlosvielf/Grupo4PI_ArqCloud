import process from "node:process";
import { mkdir, writeFile, copyFile } from "node:fs/promises";
import { createClient as createRedisClient } from "redis";
import * as Minio from "minio";
import { chromium } from "@playwright/test";

process.loadEnvFile(".env");

const output = "artigo-redis-minio";
const images = `${output}/imagens`;
await mkdir(images, { recursive: true });

const redis = createRedisClient({
  socket: { host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT) },
  password: process.env.REDIS_PASSWORD,
});
redis.on("error", () => {});
await redis.connect();

const sensor = await redis.hGetAll("grupo4:sensor:SS-01");
const ranking = await redis.zRangeWithScores("grupo4:ranking:produtividade:2025-26", 0, -1, { REV: true });
const stream = await redis.xRevRange("grupo4:stream:leituras", "+", "-", { COUNT: 5 });
const streamRows = stream.map(({ id, message }) => ({
  id,
  sensor: message.sensor,
  dados: JSON.parse(message.json),
}));
await redis.quit();

const minio = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: Number(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

const objects = [];
await new Promise((resolve, reject) => {
  const listing = minio.listObjectsV2(process.env.MINIO_BUCKET, "", true);
  listing.on("data", (object) => objects.push({ name: object.name, size: object.size, lastModified: object.lastModified }));
  listing.on("error", reject);
  listing.on("end", resolve);
});

const getObject = async (name) => {
  const chunks = [];
  const body = await minio.getObject(process.env.MINIO_BUCKET, name);
  for await (const chunk of body) chunks.push(chunk);
  return Buffer.concat(chunks);
};

const ndviObject = "ndvi/T05/2026-09-25.png";
const ndvi = await getObject(ndviObject);
await writeFile(`${images}/05-minio-ndvi.png`, ndvi);
const soil = (await getObject("laudos/analise_solo_2026.csv")).toString("utf8");

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");
const pageHtml = (title, body) => `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#101827;color:#e8eef7;font-family:Consolas,monospace;padding:42px 52px;font-size:22px}h1{font:700 30px Arial;color:#7dd3fc;margin:0 0 28px}h2{font:700 22px Arial;color:#c4b5fd;margin:26px 0 10px}.prompt{color:#86efac}.card{border:1px solid #334155;border-radius:12px;background:#172235;padding:24px;white-space:pre-wrap;line-height:1.45}.muted{color:#94a3b8}.accent{color:#fbbf24}
</style></head><body><h1>${escapeHtml(title)}</h1>${body}</body></html>`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 1 });
const screenshot = async (name, title, body) => {
  await page.setContent(pageHtml(title, body));
  await page.screenshot({ path: `${images}/${name}`, fullPage: true });
};

await screenshot("01-redis-sensor.png", "Redis — hash do sensor SS-01", `<div class="prompt">$ HGETALL grupo4:sensor:SS-01</div><div class="card">${escapeHtml(JSON.stringify(sensor, null, 2))}</div><p class="muted">Consulta somente-leitura realizada em ${escapeHtml(sensor.ts)}.</p>`);
await screenshot("02-redis-ranking-produtividade.png", "Redis — ranking de produtividade", `<div class="prompt">$ ZREVRANGE grupo4:ranking:produtividade:2025-26 0 -1 WITHSCORES</div><div class="card">${escapeHtml(ranking.map((row, index) => `${index + 1}. ${row.value} ${row.score}`).join("\n"))}</div><p class="muted">Maior: T01 (${ranking[0].score}). Menor: ${ranking.at(-1).value} (${ranking.at(-1).score}).</p>`);
await screenshot("03-redis-stream.png", "Redis — últimas leituras do stream", `<div class="prompt">$ XREVRANGE grupo4:stream:leituras + - COUNT 5</div><div class="card">${escapeHtml(streamRows.map((row) => `${row.id}  ${row.sensor}  ${row.dados.talhao}  ${row.dados.ts}\numidade 10 cm: ${row.dados.valores.umidade_10cm_pct}% | 30 cm: ${row.dados.valores.umidade_30cm_pct}%`).join("\n\n"))}</div>`);
const prefixCounts = objects.reduce((counts, object) => { const prefix = object.name.split("/")[0]; counts[prefix] = (counts[prefix] ?? 0) + 1; return counts; }, {});
await screenshot("04-minio-bucket.png", "MinIO — bucket grupo4", `<div class="prompt">$ mc ls --recursive grupo4</div><div class="card">${escapeHtml(objects.slice(0, 10).map((object) => `${object.name}  (${object.size} bytes)`).join("\n"))}\n...\n${escapeHtml(JSON.stringify(prefixCounts, null, 2))}</div><p class="muted">Inventário real: ${objects.length} objetos no bucket.</p>`);
await screenshot("06-minio-laudo-solo.png", "MinIO — laudo de solo", `<div class="prompt">$ mc cat grupo4/laudos/analise_solo_2026.csv</div><div class="card">${escapeHtml(soil.trim())}</div>`);
await page.setContent(`<html><body style="margin:0"><img src="data:image/png;base64,${ndvi.toString("base64")}" style="width:100%;height:auto"></body></html>`);
await page.screenshot({ path: `${images}/05-minio-ndvi.png`, fullPage: true });
await browser.close();

await copyFile("docs/p1/evidencias/arquitetura-atual.png", `${images}/07-uma-tela-tres-servicos.png`);
console.log(JSON.stringify({ output, sensor: sensor.ts, ranking: ranking.length, stream: stream.length, minioObjects: objects.length, ndviObject }));
