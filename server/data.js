import { createHash } from "node:crypto";
import mariadb from "mariadb";
import { MongoClient, ObjectId } from "mongodb";
import { createClient as createRedisClient } from "redis";
import * as Minio from "minio";
import { config } from "./config.js";

const pool = mariadb.createPool({
  ...config.mariadb,
  connectionLimit: 5,
  connectTimeout: 10_000,
  acquireTimeout: 10_000,
  decimalAsNumber: true,
});
const mongoClient = new MongoClient(
  `mongodb://${config.mongodb.host}:${config.mongodb.port}`,
  {
    auth: { username: config.mongodb.user, password: config.mongodb.password },
    authSource: config.mongodb.authSource,
    connectTimeoutMS: 10_000,
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 10,
  },
);
let mongoPromise;
const mongo = () =>
  (mongoPromise ??= mongoClient.connect().then(() => mongoClient.db(config.mongodb.database)));

const redis = createRedisClient({
  socket: {
    host: config.redis.host,
    port: config.redis.port,
    connectTimeout: 10_000,
    reconnectStrategy: (retries) => Math.min(retries * 250, 3_000),
  },
  password: config.redis.password,
});
redis.on("error", (error) =>
  console.error("Redis indisponível:", error instanceof Error ? error.message : "erro desconhecido"),
);
let redisPromise;
const redisConnection = () => (redisPromise ??= redis.connect().then(() => redis));

const minio = new Minio.Client(config.minio);

export async function getTalhoes() {
  const rows = await pool.query(
    `SELECT t.codigo, t.area_ha AS areaHa, c.nome AS cultura
       FROM talhao t
       JOIN cultura c ON c.id = t.cultura_atual_id
      ORDER BY t.codigo`,
  );
  return rows.map(({ codigo, areaHa, cultura }) => ({ codigo, areaHa, cultura }));
}

export async function getImagens() {
  const db = await mongo();
  const rows = await db
    .collection("imagens")
    .find(
      { bucket: config.minio.bucket, objeto: /^ndvi\/T0[1-6]\// },
      { projection: { talhao: 1, data: 1, tipo: 1, satelite: 1 } },
    )
    .sort({ data: -1 })
    .limit(100)
    .toArray();
  return rows.map((row) => ({
    id: row._id.toHexString(),
    talhao: row.talhao,
    data: row.data.toISOString(),
    tipo: row.tipo,
    satelite: row.satelite,
    url: `/api/imagens/${row._id.toHexString()}/content`,
  }));
}

export async function getLeiturasNdvi() {
  const db = await mongo();
  const rows = await db
    .collection("imagens")
    .find(
      { bucket: config.minio.bucket, ndvi_medio: { $type: "number" } },
      { projection: { talhao: 1, data: 1, ndvi_medio: 1 } },
    )
    .sort({ data: 1 })
    .limit(100)
    .toArray();
  return rows.map((row) => ({
    talhao: row.talhao,
    data: row.data.toISOString(),
    ndvi: row.ndvi_medio,
  }));
}

const severity = (value) =>
  ({ baixa: "normal", media: "atencao", alta: "risco", critica: "critico" })[value] ??
  "desconhecido";
const stableId = (value) => createHash("sha256").update(value).digest("hex").slice(0, 20);

export async function getAlertas() {
  const [db, cache] = await Promise.all([
    mongo(),
    redisConnection(),
  ]);
  const sensorRows = await pool.query(
    `SELECT s.codigo AS sensor, t.codigo AS talhao
       FROM sensor s JOIN talhao t ON t.id = s.talhao_id`,
  );
  const sensorTalhao = new Map(sensorRows.map((row) => [row.sensor, row.talhao]));
  const [historical, recentJson] = await Promise.all([
    db.collection("alertas").find({}).sort({ ts: -1 }).limit(250).toArray(),
    cache.lRange(`${config.redis.prefix}alertas:recentes`, 0, 49),
  ]);
  const historicalKeys = new Set(
    historical.map((row) => `${row.ts.toISOString()}|${row.tipo}|${row.sensor ?? ""}`),
  );
  const recent = recentJson.flatMap((raw) => {
    try {
      const row = JSON.parse(raw);
      const key = `${row.ts}|${row.tipo}|${row.sensor ?? ""}`;
      return historicalKeys.has(key) ? [] : [{ ...row, _redisKey: key }];
    } catch {
      return [];
    }
  });
  return [
    ...historical.map((row) => ({
      id: row._id.toHexString(),
      severidade: severity(row.severidade),
      titulo: row.tipo.replaceAll("_", " "),
      descricao: row.mensagem,
      talhao: row.talhao ?? sensorTalhao.get(row.sensor),
      data: row.ts.toISOString(),
      status: row.resolvido ? "resolvido" : "ativo",
    })),
    ...recent.map((row) => ({
      id: `redis-${stableId(row._redisKey)}`,
      severidade: severity(row.severidade),
      titulo: String(row.tipo).replaceAll("_", " "),
      descricao: row.mensagem,
      talhao: row.talhao ?? sensorTalhao.get(row.sensor),
      data: new Date(row.ts).toISOString(),
      status: "ativo",
    })),
  ].sort((a, b) => b.data.localeCompare(a.data));
}

export async function getTelemetria(limit = 2_000) {
  const safeLimit = Math.min(Math.max(Number(limit) || 2_000, 1), 5_000);
  const [db, machines] = await Promise.all([
    mongo(),
    pool.query("SELECT codigo, tipo, marca, modelo FROM maquina ORDER BY codigo"),
  ]);
  const names = new Map(
    machines.map((row) => [row.codigo, `${row.tipo} ${row.marca} ${row.modelo}`]),
  );
  const rows = await db
    .collection("telemetria_maquinas")
    .find(
      {},
      {
        projection: {
          maquina: 1,
          ts: 1,
          velocidade_kmh: 1,
          combustivel_pct: 1,
          rpm: 1,
          temp_motor_c: 1,
        },
      },
    )
    .sort({ ts: -1 })
    .limit(safeLimit)
    .toArray();
  return rows.map((row) => ({
    maquina: row.maquina,
    nome: names.get(row.maquina),
    data: row.ts.toISOString(),
    velocidade: row.velocidade_kmh,
    combustivel: row.combustivel_pct,
    rpm: row.rpm,
    temperatura: row.temp_motor_c,
  }));
}

export async function getImageObject(id) {
  if (!ObjectId.isValid(id)) return null;
  const db = await mongo();
  const image = await db.collection("imagens").findOne(
    {
      _id: new ObjectId(id),
      bucket: config.minio.bucket,
      objeto: /^ndvi\/T0[1-6]\/[0-9]{4}-[0-9]{2}-[0-9]{2}\.png$/,
    },
    { projection: { bucket: 1, objeto: 1 } },
  );
  if (!image) return null;
  return minio.getObject(config.minio.bucket, image.objeto);
}

export async function health() {
  const checks = await Promise.allSettled([
    pool.query("SELECT 1 AS ok"),
    mongo().then((db) => db.command({ ping: 1 })),
    redisConnection().then((client) => client.ping()),
    minio.bucketExists(config.minio.bucket),
  ]);
  const names = ["mariadb", "mongodb", "redis", "minio"];
  return Object.fromEntries(
    checks.map((check, index) => [names[index], check.status === "fulfilled"]),
  );
}

export async function persistMqtt(topic, payload) {
  if (!config.mqtt.persist) return;
  const db = await mongo();
  if (topic.includes("/sensores/") && payload.sensor && payload.ts) {
    await db.collection("leituras").updateOne(
      { sensor: payload.sensor, ts: new Date(payload.ts) },
      { $setOnInsert: { ...payload, ts: new Date(payload.ts) } },
      { upsert: true },
    );
  } else if (topic.includes("/maquinas/") && payload.maquina && payload.ts) {
    await db.collection("telemetria_maquinas").updateOne(
      { maquina: payload.maquina, ts: new Date(payload.ts) },
      { $setOnInsert: { ...payload, ts: new Date(payload.ts) } },
      { upsert: true },
    );
  } else if (topic.endsWith("/alertas") && payload.ts && payload.tipo) {
    await db.collection("alertas").updateOne(
      { ts: new Date(payload.ts), tipo: payload.tipo, sensor: payload.sensor ?? null },
      { $setOnInsert: { ...payload, ts: new Date(payload.ts) } },
      { upsert: true },
    );
  }
}

export async function closeDataConnections() {
  await Promise.allSettled([
    pool.end(),
    mongoClient.close(),
    redis.isOpen ? redis.quit() : Promise.resolve(),
  ]);
}
