import type { FarmData, NdviRecord, Severity } from "../types";
const numberFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
});
const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});
export const number = (value: number | undefined) =>
  value === undefined ? "—" : numberFormat.format(value);
export function date(value?: string) {
  if (!value) return "Sem registro";
  const d = new Date(value.length === 10 ? `${value}T12:00:00-03:00` : value);
  return Number.isNaN(d.getTime()) ? "Data indisponível" : dateFormat.format(d);
}
export function latestReading(data: FarmData, codigo: string) {
  return data.leituras
    .filter((r) => r.talhao === codigo)
    .sort((a, b) => b.data.localeCompare(a.data))[0];
}
export function health(ndvi?: number): Severity {
  return ndvi === undefined
    ? "desconhecido"
    : ndvi >= 0.7
      ? "normal"
      : ndvi >= 0.5
        ? "atencao"
        : ndvi >= 0.4
          ? "risco"
          : "critico";
}
export const labels: Record<Severity, string> = {
  normal: "Saudável",
  atencao: "Atenção",
  risco: "Risco",
  critico: "Crítico",
  desconhecido: "Sem leitura",
};
export function variation(records: NdviRecord[]) {
  const sorted = [...records].sort((a, b) => a.data.localeCompare(b.data));
  const first = sorted.at(-2)?.ndvi;
  const last = sorted.at(-1)?.ndvi;
  return first === undefined || first === 0 || last === undefined
    ? undefined
    : ((last - first) / Math.abs(first)) * 100;
}
export function latestMachines(data: FarmData) {
  const machines = new Map<string, FarmData["telemetria"][number]>();
  for (const t of data.telemetria) {
    const old = machines.get(t.maquina);
    if (!old || t.data > old.data) machines.set(t.maquina, t);
  }
  return [...machines.values()];
}
export function latestDate(data: FarmData) {
  return [
    ...data.imagens,
    ...data.leituras,
    ...data.telemetria,
    ...data.alertas,
  ]
    .map((v) => v.data)
    .sort()
    .at(-1);
}
