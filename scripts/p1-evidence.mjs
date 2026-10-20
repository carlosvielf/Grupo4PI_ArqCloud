import { mkdirSync, writeFileSync } from "node:fs";
import process from "node:process";
import mariadb from "mariadb";
import { MongoClient } from "mongodb";
import { createClient as createRedisClient } from "redis";
import * as Minio from "minio";

process.loadEnvFile(".env");

const generatedAt = new Date();
const output = {
  generatedAt: generatedAt.toISOString(),
  scope: "grupo4",
  mode: "somente leitura",
  queries: {},
  quality: {},
  inventory: {},
};

const pool = mariadb.createPool({
  host: process.env.MARIADB_HOST,
  port: Number(process.env.MARIADB_PORT),
  database: process.env.MARIADB_DATABASE,
  user: process.env.MARIADB_USER,
  password: process.env.MARIADB_PASSWORD,
  connectionLimit: 2,
});
const mongoClient = new MongoClient(
  `mongodb://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}`,
  {
    auth: { username: process.env.MONGODB_USER, password: process.env.MONGODB_PASSWORD },
    authSource: process.env.MONGODB_AUTH_SOURCE,
  },
);
const redis = createRedisClient({
  socket: { host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT) },
  password: process.env.REDIS_PASSWORD,
});
redis.on("error", () => {});
const minio = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: Number(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

const sql = async (query, values = []) => {
  const rows = await pool.query(query, values);
  return rows.map((row) => {
    const copy = { ...row };
    delete copy.meta;
    return copy;
  });
};
const aggregate = (db, collection, pipeline) =>
  db.collection(collection).aggregate(pipeline).toArray();
const count = (db, collection, filter) => db.collection(collection).countDocuments(filter);
const listObjects = (bucket) =>
  new Promise((resolve, reject) => {
    const objects = [];
    const stream = minio.listObjectsV2(bucket, "", true);
    stream.on("data", (item) => objects.push(item));
    stream.on("error", reject);
    stream.on("end", () => resolve(objects));
  });

try {
  await Promise.all([mongoClient.connect(), redis.connect()]);
  const db = mongoClient.db(process.env.MONGODB_DATABASE);

  const farmSql = `SELECT f.nome, f.municipio, f.uf, f.area_total_ha,
                          t.codigo AS talhao, t.area_ha,
                          COALESCE(c.nome, 'sem cultura cadastrada') AS cultura
                     FROM fazenda f
                     JOIN talhao t ON t.fazenda_id = f.id
                LEFT JOIN cultura c ON c.id = t.cultura_atual_id
                 ORDER BY t.codigo`;
  output.queries.q1_fazenda_talhoes = {
    question: "Qual é a composição atual da fazenda por talhão, área e cultura?",
    service: "MariaDB",
    query: farmSql,
    result: await sql(farmSql),
  };

  const ndviPipeline = [
    { $match: { ndvi_medio: { $type: "number" }, data: { $type: "date" } } },
    { $sort: { talhao: 1, data: 1 } },
    {
      $group: {
        _id: "$talhao",
        leituras: { $sum: 1 },
        primeira_data: { $first: "$data" },
        primeiro_ndvi: { $first: "$ndvi_medio" },
        ultima_data: { $last: "$data" },
        ultimo_ndvi: { $last: "$ndvi_medio" },
        media_ndvi: { $avg: "$ndvi_medio" },
      },
    },
    {
      $project: {
        _id: 0,
        talhao: "$_id",
        leituras: 1,
        primeira_data: 1,
        primeiro_ndvi: 1,
        ultima_data: 1,
        ultimo_ndvi: 1,
        media_ndvi: { $round: ["$media_ndvi", 3] },
        variacao: { $round: [{ $subtract: ["$ultimo_ndvi", "$primeiro_ndvi"] }, 3] },
      },
    },
    { $sort: { talhao: 1 } },
  ];
  output.queries.q2_evolucao_ndvi = {
    question: "Como o NDVI de cada talhão evoluiu entre a primeira e a última imagem disponível?",
    service: "MongoDB",
    collection: "imagens",
    pipeline: ndviPipeline,
    result: await aggregate(db, "imagens", ndviPipeline),
  };

  const alertsPipeline = [
    { $match: { tipo: "solo_seco" } },
    {
      $group: {
        _id: "$talhao",
        ocorrencias: { $sum: 1 },
        resolvidas: { $sum: { $cond: ["$resolvido", 1, 0] } },
        primeira: { $min: "$ts" },
        ultima: { $max: "$ts" },
      },
    },
    { $project: { _id: 0, talhao: "$_id", ocorrencias: 1, resolvidas: 1, primeira: 1, ultima: 1 } },
    { $sort: { ocorrencias: -1, talhao: 1 } },
  ];
  output.queries.q3_alertas_solo_seco = {
    question: "Quais talhões concentraram alertas de solo seco e quantos já foram resolvidos?",
    service: "MongoDB",
    collection: "alertas",
    pipeline: alertsPipeline,
    result: await aggregate(db, "alertas", alertsPipeline),
  };

  const telemetryPipeline = [
    { $match: { ts: { $type: "date" } } },
    {
      $group: {
        _id: "$maquina",
        registros: { $sum: 1 },
        inicio: { $min: "$ts" },
        fim: { $max: "$ts" },
        velocidade_media_kmh: { $avg: "$velocidade_kmh" },
        combustivel_medio_pct: { $avg: "$combustivel_pct" },
        temperatura_maxima_c: { $max: "$temp_motor_c" },
      },
    },
    {
      $project: {
        _id: 0,
        maquina: "$_id",
        registros: 1,
        inicio: 1,
        fim: 1,
        velocidade_media_kmh: { $round: ["$velocidade_media_kmh", 2] },
        combustivel_medio_pct: { $round: ["$combustivel_medio_pct", 2] },
        temperatura_maxima_c: 1,
      },
    },
    { $sort: { registros: -1, maquina: 1 } },
  ];
  output.queries.q4_telemetria_maquinas = {
    question: "Quais máquinas têm telemetria e qual foi seu perfil operacional no período?",
    service: "MongoDB",
    collection: "telemetria_maquinas",
    pipeline: telemetryPipeline,
    result: await aggregate(db, "telemetria_maquinas", telemetryPipeline),
  };

  const scannedKeys = async (pattern) => {
    const found = [];
    for await (const batch of redis.scanIterator({ MATCH: pattern, COUNT: 100 }))
      found.push(...(Array.isArray(batch) ? batch : [batch]));
    return found.sort();
  };
  const sensorKeys = await scannedKeys(`${process.env.REDIS_PREFIX}sensor:SS-*`);
  const soilNow = [];
  for (const key of sensorKeys) soilNow.push({ key, ...(await redis.hGetAll(key)) });
  output.queries.q5_umidade_atual = {
    question: "Qual é a umidade atual do solo em 10 cm e 30 cm em cada talhão monitorado?",
    service: "Redis",
    command: `SCAN MATCH ${process.env.REDIS_PREFIX}sensor:SS-*; HGETALL <chave>`,
    result: soilNow,
  };

  const dateChecks = {
    estoque_movimento: "data",
    operacao: "data_inicio",
    safra_plantio: "data_plantio",
    safra_colheita: "data_colheita",
    venda: "data",
  };
  const mariaFuture = {};
  for (const [name, column] of Object.entries(dateChecks)) {
    const table = name.startsWith("safra_") ? "safra" : name;
    const [row] = await sql(
      `SELECT COUNT(*) AS afetados, MIN(\`${column}\`) AS menor_data, MAX(\`${column}\`) AS maior_data
         FROM \`${table}\` WHERE \`${column}\` > CURRENT_DATE()`,
    );
    mariaFuture[`${table}.${column}`] = row;
  }
  output.quality.mariadb_datas_futuras = {
    query: "SELECT COUNT(*), MIN(campo), MAX(campo) FROM tabela WHERE campo > CURRENT_DATE()",
    result: mariaFuture,
    detail: {
      estoque_por_tipo: await sql("SELECT tipo, COUNT(*) AS afetados FROM estoque_movimento WHERE data > CURRENT_DATE() GROUP BY tipo ORDER BY tipo"),
      operacoes_por_tipo: await sql("SELECT tipo, COUNT(*) AS afetados FROM operacao WHERE data_inicio > CURRENT_DATE() GROUP BY tipo ORDER BY tipo"),
      safras_por_status: await sql("SELECT status, COUNT(*) AS afetados FROM safra WHERE data_plantio > CURRENT_DATE() GROUP BY status ORDER BY status"),
    },
  };
  output.quality.mariadb_inconsistencias = {
    result: {
      operacao_fim_antes_inicio: (await sql("SELECT COUNT(*) AS afetados FROM operacao WHERE data_fim < data_inicio"))[0],
      safra_colheita_antes_plantio: (await sql("SELECT COUNT(*) AS afetados FROM safra WHERE data_colheita < data_plantio"))[0],
      talhao_area_nao_positiva: (await sql("SELECT COUNT(*) AS afetados FROM talhao WHERE area_ha <= 0"))[0],
      movimento_quantidade_nao_positiva: (await sql("SELECT COUNT(*) AS afetados FROM estoque_movimento WHERE quantidade <= 0"))[0],
      venda_quantidade_ou_preco_nao_positivo: (await sql("SELECT COUNT(*) AS afetados FROM venda WHERE quantidade_kg <= 0 OR preco_kg <= 0"))[0],
      codigos_talhao_duplicados: (await sql("SELECT COUNT(*) AS afetados FROM (SELECT fazenda_id, codigo FROM talhao GROUP BY fazenda_id, codigo HAVING COUNT(*) > 1) d"))[0],
    },
  };

  const mongoQualityFilters = {
    leituras_campos_essenciais_ausentes: {
      $or: [
        { sensor: { $exists: false } }, { ts: { $exists: false } }, { tipo: { $exists: false } },
        { valores: { $exists: false } },
      ],
    },
    leituras_bateria_fora_0_100: { bateria_pct: { $not: { $gte: 0, $lte: 100 } } },
    leituras_umidade_fora_0_100: {
      $or: [
        { "valores.umidade_ar_pct": { $lt: 0 } }, { "valores.umidade_ar_pct": { $gt: 100 } },
        { "valores.umidade_10cm_pct": { $lt: 0 } }, { "valores.umidade_10cm_pct": { $gt: 100 } },
        { "valores.umidade_30cm_pct": { $lt: 0 } }, { "valores.umidade_30cm_pct": { $gt: 100 } },
      ],
    },
    imagens_ndvi_fora_menos1_1: { $or: [{ ndvi_medio: { $lt: -1 } }, { ndvi_medio: { $gt: 1 } }] },
    imagens_nuvem_fora_0_100: { $or: [{ cobertura_nuvem_pct: { $lt: 0 } }, { cobertura_nuvem_pct: { $gt: 100 } }] },
    telemetria_metricas_invalidas: {
      $or: [
        { velocidade_kmh: { $lt: 0 } }, { combustivel_pct: { $lt: 0 } },
        { combustivel_pct: { $gt: 100 } }, { rpm: { $lt: 0 } },
      ],
    },
    alertas_campos_essenciais_ausentes: {
      $or: [{ ts: { $exists: false } }, { tipo: { $exists: false } }, { severidade: { $exists: false } }, { mensagem: { $exists: false } }],
    },
  };
  const mongoQuality = {};
  for (const [name, filter] of Object.entries(mongoQualityFilters)) {
    const collection = name.split("_")[0];
    mongoQuality[name] = { filter, afetados: await count(db, collection, filter) };
  }
  const duplicateChecks = {
    leituras_sensor_ts: ["$sensor", "$ts"],
    imagens_talhao_data_tipo: ["$talhao", "$data", "$tipo"],
    telemetria_maquina_ts: ["$maquina", "$ts"],
    alertas_ts_tipo_sensor: ["$ts", "$tipo", "$sensor"],
  };
  for (const [name, fields] of Object.entries(duplicateChecks)) {
    const collection = name.split("_")[0];
    const [result] = await aggregate(db, collection, [
      { $group: { _id: fields, quantidade: { $sum: 1 } } },
      { $match: { quantidade: { $gt: 1 } } },
      { $group: { _id: null, grupos_duplicados: { $sum: 1 }, registros_nos_grupos: { $sum: "$quantidade" }, registros_excedentes: { $sum: { $subtract: ["$quantidade", 1] } } } },
    ]);
    mongoQuality[`duplicidade_${name}`] = result ?? { grupos_duplicados: 0, registros_excedentes: 0 };
  }
  const [humidityRanges] = await aggregate(db, "leituras", [
    { $group: {
      _id: null,
      menor_ar: { $min: "$valores.umidade_ar_pct" }, maior_ar: { $max: "$valores.umidade_ar_pct" },
      menor_10cm: { $min: "$valores.umidade_10cm_pct" }, maior_10cm: { $max: "$valores.umidade_10cm_pct" },
      menor_30cm: { $min: "$valores.umidade_30cm_pct" }, maior_30cm: { $max: "$valores.umidade_30cm_pct" },
    } },
  ]);
  mongoQuality.umidade_por_campo = {
    ...humidityRanges,
    ar_invalidos: await count(db, "leituras", { $or: [{ "valores.umidade_ar_pct": { $lt: 0 } }, { "valores.umidade_ar_pct": { $gt: 100 } }] }),
    solo_10cm_invalidos: await count(db, "leituras", { $or: [{ "valores.umidade_10cm_pct": { $lt: 0 } }, { "valores.umidade_10cm_pct": { $gt: 100 } }] }),
    solo_30cm_invalidos: await count(db, "leituras", { $or: [{ "valores.umidade_30cm_pct": { $lt: 0 } }, { "valores.umidade_30cm_pct": { $gt: 100 } }] }),
  };
  mongoQuality.amostra_umidade_invalida = await db.collection("leituras")
    .find(mongoQualityFilters.leituras_umidade_fora_0_100, { projection: { _id: 0, sensor: 1, ts: 1, tipo: 1, valores: 1 } })
    .sort({ ts: 1 }).limit(20).toArray();
  mongoQuality.amostra_duplicidade_leituras = await aggregate(db, "leituras", [
    { $group: { _id: { sensor: "$sensor", ts: "$ts" }, quantidade: { $sum: 1 } } },
    { $match: { quantidade: { $gt: 1 } } },
    { $sort: { "_id.ts": 1, "_id.sensor": 1 } },
    { $limit: 20 },
  ]);
  output.quality.mongodb = mongoQuality;
  output.quality.mongodb.imagens_por_satelite = await aggregate(db, "imagens", [
    { $group: { _id: "$satelite", documentos: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const bucket = process.env.MINIO_BUCKET;
  const objects = await listObjects(bucket);
  const objectNames = new Set(objects.map((item) => item.name));
  const imageDocs = await db.collection("imagens").find({}, { projection: { objeto: 1, bucket: 1 } }).toArray();
  const referenced = new Set(imageDocs.map((item) => item.objeto));
  output.quality.minio_mongodb = {
    referencias_mongo_sem_objeto: [...referenced].filter((name) => !objectNames.has(name)),
    pngs_minio_sem_catalogo_mongo: [...objectNames].filter((name) => name.endsWith(".png") && !referenced.has(name)),
    documentos_bucket_divergente: imageDocs.filter((item) => item.bucket !== bucket).length,
  };

  const collections = {};
  for (const name of ["leituras", "telemetria_maquinas", "alertas", "imagens"]) {
    const [range] = await aggregate(db, name, [
      { $project: { dataAuditoria: { $ifNull: ["$ts", "$data"] } } },
      { $group: { _id: null, total: { $sum: 1 }, minimo: { $min: "$dataAuditoria" }, maximo: { $max: "$dataAuditoria" } } },
    ]);
    collections[name] = range;
  }
  output.inventory.mongodb = collections;
  output.inventory.mariadb = Object.fromEntries(
    await Promise.all(
      ["cliente", "cultura", "estoque_movimento", "fazenda", "funcionario", "insumo", "maquina", "operacao", "safra", "sensor", "talhao", "venda"]
        .map(async (table) => [table, (await sql(`SELECT COUNT(*) AS total FROM \`${table}\``))[0].total]),
    ),
  );
  const scopedRedisKeys = await scannedKeys(`${process.env.REDIS_PREFIX}*`);
  const redisTtls = [];
  for (const key of scopedRedisKeys) redisTtls.push({ key, ttl: await redis.ttl(key) });
  output.inventory.redis = {
    keys: await redis.dbSize(),
    scopedKeys: scopedRedisKeys.length,
    ttl: {
      semExpiracao: redisTtls.filter((item) => item.ttl === -1).length,
      comExpiracao: redisTtls.filter((item) => item.ttl >= 0).length,
    },
  };
  const extensionSummary = {};
  for (const item of objects) {
    const extension = item.name.split(".").at(-1).toLowerCase();
    extensionSummary[extension] ??= { objects: 0, bytes: 0 };
    extensionSummary[extension].objects += 1;
    extensionSummary[extension].bytes += item.size;
  }
  output.inventory.minio = {
    bucket,
    objects: objects.length,
    bytes: objects.reduce((sum, item) => sum + item.size, 0),
    byExtension: extensionSummary,
  };

  mkdirSync("docs/p1/evidencias", { recursive: true });
  writeFileSync(
    "docs/p1/evidencias/consultas-resultados.json",
    `${JSON.stringify(output, (_key, value) => (typeof value === "bigint" ? Number(value) : value), 2)}\n`,
  );
  console.log(JSON.stringify({ ok: true, generatedAt: output.generatedAt }));
} finally {
  await Promise.allSettled([
    pool.end(),
    mongoClient.close(),
    redis.isOpen ? redis.quit() : Promise.resolve(),
  ]);
}
