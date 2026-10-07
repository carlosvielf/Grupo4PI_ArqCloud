import mqtt from "mqtt";
import { config } from "./config.js";
import { persistMqtt } from "./data.js";

const listeners = new Set();
let client;

export function startMqtt() {
  if (client) return client;
  client = mqtt.connect({
    host: config.mqtt.host,
    port: config.mqtt.port,
    protocol: "mqtt",
    username: config.mqtt.user,
    password: config.mqtt.password,
    connectTimeout: 10_000,
    reconnectPeriod: 3_000,
    clean: true,
  });
  client.on("connect", () =>
    client.subscribe(config.mqtt.topic, { qos: 0 }, (error) => {
      if (error) console.error("Falha ao assinar MQTT:", error.message);
    }),
  );
  client.on("message", async (topic, buffer) => {
    if (!topic.startsWith("fazenda/grupo4/")) return;
    try {
      const payload = JSON.parse(buffer.toString("utf8"));
      if (!payload || typeof payload !== "object") return;
      await persistMqtt(topic, payload);
      const resource = topic.includes("/maquinas/")
        ? "telemetria"
        : topic.endsWith("/alertas")
          ? "alertas"
          : undefined;
      if (resource) for (const listener of listeners) listener({ resource, topic });
    } catch (error) {
      console.error("Mensagem MQTT inválida:", error instanceof Error ? error.message : "erro desconhecido");
    }
  });
  client.on("error", (error) => console.error("MQTT indisponível:", error.message));
  return client;
}

export function addMqttListener(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function stopMqtt() {
  client?.end(true);
  client = undefined;
}
