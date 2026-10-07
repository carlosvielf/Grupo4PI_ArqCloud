import assert from "node:assert/strict";
import test from "node:test";

process.env.MQTT_PERSIST_ENABLED = "false";
const { startServer, stopServer } = await import("../server/index.js");
const base = `http://${process.env.API_HOST || "127.0.0.1"}:${process.env.API_PORT || 3001}`;

async function get(path) {
  const response = await fetch(`${base}${path}`);
  assert.equal(response.status, 200, `${path} retornou HTTP ${response.status}`);
  return response;
}

test.before(async () => {
  await startServer();
});

test.after(async () => {
  await stopServer();
});

test("health verifica as quatro dependências consultadas", async () => {
  const body = await (await get("/api/health")).json();
  assert.deepEqual(body, {
    ok: true,
    group: 4,
    services: { mariadb: true, mongodb: true, redis: true, minio: true },
  });
});

test("endpoints retornam somente estruturas reais do Grupo 4", async () => {
  const [talhoes, imagens, leituras, alertas, telemetria] = await Promise.all(
    ["talhoes", "imagens", "leituras", "alertas", "telemetria"].map(async (name) =>
      (await get(`/api/${name}`)).json(),
    ),
  );
  assert.deepEqual(
    talhoes.map((row) => row.codigo),
    ["T01", "T02", "T03", "T04", "T05", "T06"],
  );
  assert.equal(imagens.length, 48);
  assert.equal(leituras.length, 48);
  assert.ok(alertas.length >= 244);
  assert.ok(telemetria.length > 0 && telemetria.length <= 2_000);
  assert.ok(imagens.every((row) => /^\/api\/imagens\/[a-f0-9]{24}\/content$/.test(row.url)));
  assert.ok(leituras.every((row) => row.ndvi >= -1 && row.ndvi <= 1));
  const serialized = JSON.stringify({ talhoes, imagens, leituras, alertas, telemetria });
  assert.doesNotMatch(serialized, /grupo[123](?!\d)/i);
});

test("imagem privada é mediada pelo backend", async () => {
  const images = await (await get("/api/imagens")).json();
  const response = await get(images[0].url);
  assert.equal(response.headers.get("content-type"), "image/png");
  const signature = new Uint8Array(await response.arrayBuffer()).slice(0, 8);
  assert.deepEqual([...signature], [137, 80, 78, 71, 13, 10, 26, 10]);
});
