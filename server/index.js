import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import {
  closeDataConnections,
  getAlertas,
  getImageObject,
  getImagens,
  getLeiturasNdvi,
  getTalhoes,
  getTelemetria,
  health,
} from "./data.js";
import { addMqttListener, startMqtt, stopMqtt } from "./mqtt.js";

const json = (response, status, body) => {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
};
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};
const dist = resolve("dist");

export const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  try {
    if (request.method === "GET" && url.pathname === "/api/talhoes")
      return json(response, 200, await getTalhoes());
    if (request.method === "GET" && url.pathname === "/api/imagens")
      return json(response, 200, await getImagens());
    if (request.method === "GET" && url.pathname === "/api/leituras")
      return json(response, 200, await getLeiturasNdvi());
    if (request.method === "GET" && url.pathname === "/api/alertas")
      return json(response, 200, await getAlertas());
    if (request.method === "GET" && url.pathname === "/api/telemetria")
      return json(response, 200, await getTelemetria(url.searchParams.get("limit")));
    if (request.method === "GET" && url.pathname === "/api/health") {
      const services = await health();
      const ok = Object.values(services).every(Boolean);
      return json(response, ok ? 200 : 503, { ok, group: 4, services });
    }
    if (request.method === "GET" && url.pathname === "/api/events") {
      response.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      });
      response.write(": conectado\n\n");
      const remove = addMqttListener((event) =>
        response.write(`event: update\ndata: ${JSON.stringify(event)}\n\n`),
      );
      const keepAlive = setInterval(() => response.write(": keepalive\n\n"), 20_000);
      request.on("close", () => {
        clearInterval(keepAlive);
        remove();
      });
      return;
    }
    const imageMatch = url.pathname.match(/^\/api\/imagens\/([a-f0-9]{24})\/content$/);
    if (request.method === "GET" && imageMatch) {
      const stream = await getImageObject(imageMatch[1]);
      if (!stream) return json(response, 404, { error: "Imagem não encontrada." });
      response.writeHead(200, {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      });
      stream.on("error", () => response.destroy());
      return stream.pipe(response);
    }
    if (request.method !== "GET" && request.method !== "HEAD")
      return json(response, 405, { error: "Método não permitido." });
    if (existsSync(dist)) {
      const candidate = resolve(dist, normalize(url.pathname).replace(/^[/\\]+/, ""));
      const file = candidate.startsWith(dist) && existsSync(candidate) && statSync(candidate).isFile()
        ? candidate
        : join(dist, "index.html");
      response.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
      return createReadStream(file).pipe(response);
    }
    return json(response, 404, { error: "Rota não encontrada." });
  } catch (error) {
    console.error("Falha na requisição:", error instanceof Error ? error.message : "erro desconhecido");
    return json(response, 503, { error: "Fonte de dados temporariamente indisponível." });
  }
});

export function startServer() {
  startMqtt();
  return new Promise((resolveStart) =>
    server.listen(config.api.port, config.api.host, () => {
      console.log(`Monitora.G4 API em http://${config.api.host}:${config.api.port}`);
      resolveStart(server);
    }),
  );
}

export async function stopServer() {
  stopMqtt();
  await new Promise((resolveStop) => server.close(resolveStop));
  await closeDataConnections();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]))
  startServer();
