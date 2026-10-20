import process from "node:process";
import mariadb from "mariadb";
import { MongoClient } from "mongodb";

process.loadEnvFile(".env");

const clean = (rows) => rows.map((row) => {
  const result = {};
  for (const [key, value] of Object.entries(row)) {
    if (!/^\d+$/.test(key)) result[key] = value instanceof Date ? value.toISOString() : value;
  }
  return result;
});

const maria = mariadb.createPool({
  host: process.env.MARIADB_HOST,
  port: Number(process.env.MARIADB_PORT),
  database: process.env.MARIADB_DATABASE,
  user: process.env.MARIADB_USER,
  password: process.env.MARIADB_PASSWORD,
  connectionLimit: 2,
  decimalAsNumber: true,
});
const mq = async (sql) => clean(await maria.query(sql));

const mongoClient = new MongoClient(
  `mongodb://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}`,
  {
    auth: { username: process.env.MONGODB_USER, password: process.env.MONGODB_PASSWORD },
    authSource: process.env.MONGODB_AUTH_SOURCE,
  },
);
await mongoClient.connect();
const mongo = mongoClient.db(process.env.MONGODB_DATABASE);

const out = {
  mariadb: {
    tables: await mq("SELECT table_name AS tabela, table_rows AS estimativa_linhas FROM information_schema.tables WHERE table_schema=DATABASE() ORDER BY table_name"),
    columns: await mq("SELECT table_name AS tabela, column_name AS coluna, data_type AS tipo, is_nullable AS nulo, column_key AS chave FROM information_schema.columns WHERE table_schema=DATABASE() ORDER BY table_name, ordinal_position"),
    counts: await mq("SELECT (SELECT COUNT(*) FROM talhao) AS talhoes, (SELECT COUNT(*) FROM operacao) AS operacoes, (SELECT COUNT(*) FROM maquina) AS maquinas, (SELECT COUNT(*) FROM venda) AS vendas, (SELECT COUNT(*) FROM estoque_movimento) AS movimentos_estoque"),
    queries: {
      fazenda: await mq("SELECT id,nome,municipio,uf,area_total_ha FROM fazenda ORDER BY id"),
      operacoes_por_talhao: await mq("SELECT t.codigo AS talhao, COUNT(o.id) AS quantidade_operacoes FROM talhao t LEFT JOIN operacao o ON o.talhao_id=t.id GROUP BY t.id,t.codigo ORDER BY t.codigo"),
      operacoes_por_maquina: await mq("SELECT m.codigo AS maquina, m.tipo, COUNT(o.id) AS operacoes, ROUND(COALESCE(SUM(o.custo_total),0),2) AS custo_total, ROUND(COALESCE(SUM(TIMESTAMPDIFF(MINUTE,o.data_inicio,o.data_fim))/60,0),2) AS horas_operacao FROM maquina m LEFT JOIN operacao o ON o.maquina_id=m.id GROUP BY m.id,m.codigo,m.tipo ORDER BY m.codigo"),
      operacao_113: await mq("SELECT o.id AS operacao_id, o.talhao_id, t.codigo AS talhao, o.maquina_id, m.codigo AS maquina, o.tipo, o.data_inicio, o.data_fim, o.custo_total FROM operacao o JOIN talhao t ON t.id=o.talhao_id LEFT JOIN maquina m ON m.id=o.maquina_id WHERE o.id=113"),
      maquinas: await mq("SELECT codigo,tipo,marca,modelo FROM maquina ORDER BY codigo"),
      estoque_por_insumo: await mq("SELECT i.nome AS insumo, SUM(CASE WHEN em.tipo='entrada' THEN em.quantidade ELSE -em.quantidade END) AS saldo, COUNT(em.id) AS movimentos FROM insumo i JOIN estoque_movimento em ON em.insumo_id=i.id GROUP BY i.id,i.nome ORDER BY i.nome LIMIT 20"),
    },
  },
  mongodb: {
    collections: await mongo.listCollections().toArray(),
    counts: {},
    queries: {},
  },
};

for (const name of ["leituras", "telemetria_maquinas", "alertas", "imagens"]) out.mongodb.counts[name] = await mongo.collection(name).countDocuments();
out.mongodb.queries.alertas_por_tipo = await mongo.collection("alertas").aggregate([
  { $group: { _id: "$tipo", total: { $sum: 1 } } },
  { $sort: { total: -1, _id: 1 } },
]).toArray();
out.mongodb.queries.telemetria_por_maquina = await mongo.collection("telemetria_maquinas").aggregate([
  { $group: { _id: "$maquina", leituras: { $sum: 1 }, velocidade_media: { $avg: "$velocidade_kmh" }, rpm_medio: { $avg: "$rpm" } } },
  { $sort: { _id: 1 } },
]).toArray();
out.mongodb.queries.ndvi_por_talhao = await mongo.collection("imagens").aggregate([
  { $match: { ndvi_medio: { $type: "number" } } },
  { $group: { _id: "$talhao", imagens: { $sum: 1 }, ndvi_medio: { $avg: "$ndvi_medio" }, ndvi_min: { $min: "$ndvi_medio" }, ndvi_max: { $max: "$ndvi_medio" } } },
  { $sort: { _id: 1 } },
]).toArray();
out.mongodb.queries.alerta_intervalo = await mongo.collection("alertas").aggregate([
  { $group: { _id: null, primeiro: { $min: "$ts" }, ultimo: { $max: "$ts" } } },
]).toArray();
out.mongodb.queries.telemetria_operacao_113 = await mongo.collection("telemetria_maquinas").find(
  { operacao_id: 113 },
  { projection: { _id: 0, maquina: 1, tipo_maquina: 1, operacao_id: 1, talhao: 1, ts: 1, velocidade_kmh: 1, rpm: 1, combustivel_pct: 1, temp_motor_c: 1 } },
).sort({ ts: 1 }).limit(5).toArray();
out.mongodb.samples = {};
for (const name of ["telemetria_maquinas", "alertas", "imagens", "leituras", "historico_sensores"]) {
  out.mongodb.samples[name] = await mongo.collection(name).findOne({}, { projection: { _id: 0 } });
}

const summary = {
  mariadb: {
    fazenda: out.mariadb.queries.fazenda,
    tables: out.mariadb.tables,
    counts: out.mariadb.counts,
    operacoes_por_talhao: out.mariadb.queries.operacoes_por_talhao,
    operacoes_por_maquina: out.mariadb.queries.operacoes_por_maquina,
    operacao_113: out.mariadb.queries.operacao_113,
    maquinas: out.mariadb.queries.maquinas,
    estoque_por_insumo: out.mariadb.queries.estoque_por_insumo,
  },
  mongodb: {
    collections: out.mongodb.collections.map(({ name, type }) => ({ name, type })),
    counts: out.mongodb.counts,
    queries: out.mongodb.queries,
    samples: out.mongodb.samples,
  },
};
console.log(JSON.stringify(summary, (_, value) => typeof value === "bigint" ? Number(value) : value, 2));
await maria.end();
await mongoClient.close();
