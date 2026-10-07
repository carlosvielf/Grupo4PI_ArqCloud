import process from "node:process";

try {
  process.loadEnvFile(".env");
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
}

function port(name) {
  const value = Number(required(name));
  if (!Number.isInteger(value) || value < 1 || value > 65_535)
    throw new Error(`Porta inválida: ${name}`);
  return value;
}

export const config = Object.freeze({
  api: {
    host: process.env.API_HOST || "127.0.0.1",
    port: Number(process.env.API_PORT || 3001),
  },
  mariadb: {
    host: required("MARIADB_HOST"),
    port: port("MARIADB_PORT"),
    database: required("MARIADB_DATABASE"),
    user: required("MARIADB_USER"),
    password: required("MARIADB_PASSWORD"),
  },
  mongodb: {
    host: required("MONGODB_HOST"),
    port: port("MONGODB_PORT"),
    database: required("MONGODB_DATABASE"),
    user: required("MONGODB_USER"),
    password: required("MONGODB_PASSWORD"),
    authSource: required("MONGODB_AUTH_SOURCE"),
  },
  redis: {
    host: required("REDIS_HOST"),
    port: port("REDIS_PORT"),
    password: required("REDIS_PASSWORD"),
    prefix: required("REDIS_PREFIX"),
  },
  mqtt: {
    host: required("MQTT_HOST"),
    port: port("MQTT_PORT"),
    user: required("MQTT_USER"),
    password: required("MQTT_PASSWORD"),
    topic: required("MQTT_TOPIC"),
    persist: process.env.MQTT_PERSIST_ENABLED === "true",
  },
  minio: {
    endPoint: required("MINIO_ENDPOINT"),
    port: port("MINIO_PORT"),
    accessKey: required("MINIO_ACCESS_KEY"),
    secretKey: required("MINIO_SECRET_KEY"),
    bucket: required("MINIO_BUCKET"),
    useSSL: process.env.MINIO_USE_SSL === "true",
  },
});

if (
  config.mariadb.database !== "grupo4" ||
  config.mongodb.database !== "grupo4" ||
  config.redis.prefix !== "grupo4:" ||
  config.mqtt.topic !== "fazenda/grupo4/#" ||
  config.minio.bucket !== "grupo4"
) {
  throw new Error("Configuração recusada: o backend deve operar exclusivamente no Grupo 4.");
}
