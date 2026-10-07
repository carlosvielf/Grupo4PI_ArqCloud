import process from "node:process";
import { writeFileSync } from "node:fs";
import mariadb from "mariadb";
import { MongoClient } from "mongodb";
import { createClient as createRedisClient } from "redis";
import mqtt from "mqtt";
import * as Minio from "minio";

process.loadEnvFile(".env");

const report = {};
const safeError = (error) =>
  error instanceof Error ? error.message.replace(/:\/\/[^@\s]+@/g, "://***@") : String(error);

async function auditMariaDb() {
  const pool = mariadb.createPool({
    host: process.env.MARIADB_HOST,
    port: Number(process.env.MARIADB_PORT),
    database: process.env.MARIADB_DATABASE,
    user: process.env.MARIADB_USER,
    password: process.env.MARIADB_PASSWORD,
    connectionLimit: 2,
    connectTimeout: 10_000,
    acquireTimeout: 10_000,
  });
  try {
    const database = process.env.MARIADB_DATABASE;
    const tables = await pool.query(
      `SELECT TABLE_NAME, TABLE_ROWS
         FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME`,
      [database],
    );
    const columns = await pool.query(
      `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY,
              EXTRA, ORDINAL_POSITION
         FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ?
        ORDER BY TABLE_NAME, ORDINAL_POSITION`,
      [database],
    );
    const foreignKeys = await pool.query(
      `SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
         FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL
        ORDER BY TABLE_NAME, COLUMN_NAME`,
      [database],
    );
    const indexes = await pool.query(
      `SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME
         FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = ?
        ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`,
      [database],
    );
    const counts = {};
    const ranges = {};
    for (const table of tables) {
      if (!/^[a-z0-9_]+$/i.test(table.TABLE_NAME)) continue;
      const [count] = await pool.query(`SELECT COUNT(*) AS total FROM \`${table.TABLE_NAME}\``);
      counts[table.TABLE_NAME] = Number(count.total);
      const dateColumns = columns.filter(
        (column) =>
          column.TABLE_NAME === table.TABLE_NAME &&
          /date|time|year|timestamp/i.test(column.COLUMN_TYPE),
      );
      for (const column of dateColumns) {
        if (!/^[a-z0-9_]+$/i.test(column.COLUMN_NAME)) continue;
        const [range] = await pool.query(
          `SELECT MIN(\`${column.COLUMN_NAME}\`) AS minimo, MAX(\`${column.COLUMN_NAME}\`) AS maximo FROM \`${table.TABLE_NAME}\``,
        );
        ranges[`${table.TABLE_NAME}.${column.COLUMN_NAME}`] = {
          minimo: range.minimo,
          maximo: range.maximo,
        };
      }
    }
    report.mariadb = {
      ok: true,
      database,
      tables: tables.map(({ TABLE_NAME }) => TABLE_NAME),
      columns,
      foreignKeys,
      indexes,
      counts,
      ranges,
    };
  } catch (error) {
    report.mariadb = { ok: false, error: safeError(error) };
  } finally {
    await pool.end();
  }
}

function bsonShape(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return value.length ? [`array<${bsonShape(value[0])}>`] : ["array"];
  if (value instanceof Date) return "date";
  if (typeof value !== "object") return typeof value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, bsonShape(child)]));
}

async function auditMongoDb() {
  const client = new MongoClient(
    `mongodb://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}`,
    {
      auth: {
        username: process.env.MONGODB_USER,
        password: process.env.MONGODB_PASSWORD,
      },
      authSource: process.env.MONGODB_AUTH_SOURCE,
      connectTimeoutMS: 10_000,
      serverSelectionTimeoutMS: 10_000,
    },
  );
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DATABASE);
    const collectionInfos = await db.listCollections({}, { nameOnly: true }).toArray();
    const collections = {};
    for (const { name } of collectionInfos) {
      const collection = db.collection(name);
      const [count, sample] = await Promise.all([
        collection.estimatedDocumentCount(),
        collection.findOne({}, { sort: { ts: -1, data: -1 } }),
      ]);
      const dateFields = sample
        ? Object.entries(sample)
            .filter(([, value]) => value instanceof Date)
            .map(([key]) => key)
        : [];
      const ranges = {};
      for (const field of dateFields) {
        const [range] = await collection
          .aggregate([
            { $match: { [field]: { $type: "date" } } },
            { $group: { _id: null, minimo: { $min: `$${field}` }, maximo: { $max: `$${field}` } } },
          ])
          .toArray();
        ranges[field] = range ? { minimo: range.minimo, maximo: range.maximo } : null;
      }
      collections[name] = {
        count,
        shape: sample ? bsonShape(sample) : null,
        sample,
        ranges,
      };
    }
    report.mongodb = { ok: true, database: process.env.MONGODB_DATABASE, collections };
  } catch (error) {
    report.mongodb = { ok: false, error: safeError(error) };
  } finally {
    await client.close();
  }
}

async function auditRedis() {
  const client = createRedisClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      connectTimeout: 10_000,
    },
    password: process.env.REDIS_PASSWORD,
  });
  client.on("error", () => {});
  try {
    await client.connect();
    const keys = [];
    for await (const batch of client.scanIterator({
      MATCH: `${process.env.REDIS_PREFIX}*`,
      COUNT: 100,
    })) {
      for (const key of Array.isArray(batch) ? batch : [batch]) {
        keys.push(key);
        if (keys.length >= 1_000) break;
      }
      if (keys.length >= 1_000) break;
    }
    keys.sort();
    const inspected = [];
    for (const key of keys) {
      const [type, ttl] = await Promise.all([client.type(key), client.ttl(key)]);
      let sample;
      if (type === "hash") sample = await client.hGetAll(key);
      else if (type === "list") sample = await client.lRange(key, 0, 2);
      else if (type === "zset") sample = await client.zRangeWithScores(key, 0, 4, { REV: true });
      else if (type === "stream") sample = await client.xRevRange(key, "+", "-", { COUNT: 2 });
      else if (type === "set") sample = await client.sRandMemberCount(key, 3);
      else if (type === "string") sample = await client.get(key);
      inspected.push({ key, type, ttl, sample });
    }
    report.redis = { ok: true, pattern: `${process.env.REDIS_PREFIX}*`, count: keys.length, keys: inspected };
  } catch (error) {
    report.redis = { ok: false, error: safeError(error) };
  } finally {
    if (client.isOpen) await client.quit();
  }
}

async function auditMqtt() {
  await new Promise((resolve) => {
    const messages = [];
    const started = Date.now();
    let finished = false;
    const client = mqtt.connect({
      host: process.env.MQTT_HOST,
      port: Number(process.env.MQTT_PORT),
      protocol: "mqtt",
      username: process.env.MQTT_USER,
      password: process.env.MQTT_PASSWORD,
      connectTimeout: 10_000,
      reconnectPeriod: 0,
      clean: true,
    });
    const finish = (result) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      report.mqtt = result;
      client.end(true);
      resolve();
    };
    const timer = setTimeout(() =>
      finish({
        ok: true,
        topic: process.env.MQTT_TOPIC,
        observedMs: Date.now() - started,
        messages,
      }), 75_000);
    client.once("connect", () => {
      client.subscribe(process.env.MQTT_TOPIC, { qos: 0 }, (error) => {
        if (error) finish({ ok: false, error: safeError(error) });
      });
    });
    client.on("message", (topic, payload) => {
      if (!topic.startsWith("fazenda/grupo4/")) return;
      let value = payload.toString("utf8");
      try {
        value = JSON.parse(value);
      } catch {
        // Mantém texto somente para documentar formatos não JSON.
      }
      messages.push({ topic, payload: value, receivedAt: new Date().toISOString() });
      if (messages.length >= 20) finish({
        ok: true,
        topic: process.env.MQTT_TOPIC,
        observedMs: Date.now() - started,
        messages,
      });
    });
    client.once("error", (error) => finish({ ok: false, error: safeError(error) }));
  });
}

async function auditMinio() {
  const client = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: Number(process.env.MINIO_PORT),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
  });
  try {
    const bucket = process.env.MINIO_BUCKET;
    const exists = await client.bucketExists(bucket);
    const objects = [];
    if (exists) {
      await new Promise((resolve, reject) => {
        const stream = client.listObjectsV2(bucket, "", true);
        stream.on("data", (object) => {
          if (objects.length < 1_000) objects.push(object);
        });
        stream.on("error", reject);
        stream.on("end", resolve);
      });
    }
    report.minio = { ok: true, bucket, exists, count: objects.length, objects };
  } catch (error) {
    report.minio = { ok: false, error: safeError(error) };
  }
}

const audits = {
  mariadb: auditMariaDb,
  mongodb: auditMongoDb,
  redis: auditRedis,
  mqtt: auditMqtt,
  minio: auditMinio,
};
const requested = new Set(process.argv.slice(2));
await Promise.all(
  Object.entries(audits)
    .filter(([service]) => requested.size === 0 || requested.has(service))
    .map(async ([service, audit]) => {
    let timer;
    try {
      await Promise.race([
        audit(),
        new Promise((_, reject) => {
          const timeoutMs = service === "mqtt" ? 85_000 : 30_000;
          timer = setTimeout(
            () => reject(new Error(`timeout de auditoria (${timeoutMs / 1000} s)`)),
            timeoutMs,
          );
        }),
      ]);
    } catch (error) {
      report[service] ??= { ok: false, error: safeError(error) };
    } finally {
      clearTimeout(timer);
    }
    }),
);

const jsonReplacer = (_key, value) =>
  typeof value === "bigint" ? Number(value) : value;
writeFileSync(
  ".audit-report.json",
  `${JSON.stringify(report, jsonReplacer, 2)}\n`,
);
console.log(
  JSON.stringify(
    Object.fromEntries(
      Object.entries(report).map(([service, result]) => [
        service,
        result.ok
          ? {
              ok: true,
              count:
                result.count ??
                result.messages?.length ??
                Object.keys(result.collections ?? result.counts ?? {}).length,
            }
          : result,
      ]),
    ),
  ),
);
process.exit(0);
