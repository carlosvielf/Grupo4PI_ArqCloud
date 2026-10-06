import type {
  Alerta,
  FarmData,
  Imagem,
  NdviRecord,
  Severity,
  Talhao,
  Telemetry,
} from "../types";
type Row = Record<string, unknown>;
function row(v: unknown): Row {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw new Error("Registro inválido na resposta.");
  return v as Row;
}
function text(r: Row, key: string): string {
  const v = r[key];
  if (typeof v !== "string" || !v.trim())
    throw new Error(
      `Campo obrigatório ausente: ${key}. Revise o adaptador da API.`,
    );
  return v;
}
function optionalText(r: Row, key: string) {
  const v = r[key];
  return typeof v === "string" ? v : undefined;
}
function numeric(r: Row, key: string) {
  const v = r[key];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "number" || !Number.isFinite(v))
    throw new Error(`Campo numérico inválido: ${key}.`);
  return v;
}
function timestamp(r: Row) {
  const v = text(r, "data");
  if (!/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(v) || Number.isNaN(Date.parse(v)))
    throw new Error("Data inválida na resposta.");
  return v;
}
function severity(v: unknown): Severity {
  return ["normal", "atencao", "risco", "critico", "desconhecido"].includes(
    String(v),
  )
    ? (v as Severity)
    : "desconhecido";
}
export function rows(value: unknown): Row[] {
  const payload = Array.isArray(value) ? value : row(value).data;
  if (!Array.isArray(payload))
    throw new Error(
      "Esperado um array ou { data: [] }. Revise o adaptador da API.",
    );
  return payload.map(row);
}
export function adaptTalhoes(value: unknown): Talhao[] {
  return rows(value).map((r) => ({
    codigo: text(r, "codigo"),
    nome: optionalText(r, "nome"),
    areaHa: numeric(r, "areaHa"),
    cultura: optionalText(r, "cultura"),
    status: r.status === undefined ? undefined : severity(r.status),
  }));
}
export function adaptImagens(value: unknown): Imagem[] {
  return rows(value).map((r, i) => ({
    id: optionalText(r, "id") ?? optionalText(r, "_id") ?? `imagem-${i}`,
    talhao: text(r, "talhao"),
    data: timestamp(r),
    tipo: text(r, "tipo"),
    satelite: text(r, "satelite"),
    url: optionalText(r, "url"),
  }));
}
export function adaptAlertas(value: unknown): Alerta[] {
  return rows(value).map((r, i) => {
    if (r.status !== "ativo" && r.status !== "resolvido")
      throw new Error("Status de alerta inválido. Revise o adaptador.");
    return {
      id: optionalText(r, "id") ?? optionalText(r, "_id") ?? `alerta-${i}`,
      severidade: severity(r.severidade),
      titulo: text(r, "titulo"),
      descricao: text(r, "descricao"),
      talhao: optionalText(r, "talhao"),
      maquina: optionalText(r, "maquina"),
      data: timestamp(r),
      status: r.status,
    };
  });
}
export function adaptLeituras(value: unknown): NdviRecord[] {
  return rows(value).map((r) => {
    const ndvi = numeric(r, "ndvi");
    if (ndvi === undefined || ndvi < -1 || ndvi > 1)
      throw new Error("NDVI ausente ou fora do intervalo [-1, 1].");
    return { talhao: text(r, "talhao"), data: timestamp(r), ndvi };
  });
}
export function adaptTelemetria(value: unknown): Telemetry[] {
  return rows(value).map((r) => ({
    maquina: text(r, "maquina"),
    nome: optionalText(r, "nome"),
    data: timestamp(r),
    online: typeof r.online === "boolean" ? r.online : undefined,
    velocidade: numeric(r, "velocidade"),
    combustivel: numeric(r, "combustivel"),
    rpm: numeric(r, "rpm"),
    temperatura: numeric(r, "temperatura"),
  }));
}
export const adapters: {
  [K in keyof FarmData]: (value: unknown) => FarmData[K];
} = {
  talhoes: adaptTalhoes,
  imagens: adaptImagens,
  alertas: adaptAlertas,
  leituras: adaptLeituras,
  telemetria: adaptTelemetria,
};
