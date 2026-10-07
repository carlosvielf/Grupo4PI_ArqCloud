import { MongoClient } from "mongodb";

process.loadEnvFile(".env");
const client = new MongoClient(
  `mongodb://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}`,
  {
    auth: { username: process.env.MONGODB_USER, password: process.env.MONGODB_PASSWORD },
    authSource: process.env.MONGODB_AUTH_SOURCE,
  },
);
await client.connect();
const db = client.db("grupo4");
const grouped = async (collection, field) =>
  db.collection(collection).aggregate([
    { $group: { _id: `$${field}`, total: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]).toArray();
console.log(JSON.stringify({
  severidades: await grouped("alertas", "severidade"),
  tipos: await grouped("alertas", "tipo"),
  maquinas: await grouped("telemetria_maquinas", "maquina"),
}));
await client.close();
