// Contrato provisório da interface. Validar os adaptadores com o backend real.
export type Severity =
  "normal" | "atencao" | "risco" | "critico" | "desconhecido";
export interface Talhao {
  codigo: string;
  nome?: string;
  areaHa?: number;
  cultura?: string;
  status?: Severity;
}
export interface Imagem {
  id: string;
  talhao: string;
  data: string;
  tipo: string;
  satelite: string;
  url?: string;
}
export interface Alerta {
  id: string;
  severidade: Severity;
  titulo: string;
  descricao: string;
  talhao?: string;
  maquina?: string;
  data: string;
  status: "ativo" | "resolvido";
}
export interface NdviRecord {
  talhao: string;
  data: string;
  ndvi: number;
}
export interface Telemetry {
  maquina: string;
  nome?: string;
  data: string;
  online?: boolean;
  velocidade?: number;
  combustivel?: number;
  rpm?: number;
  temperatura?: number;
}
export interface FarmData {
  talhoes: Talhao[];
  imagens: Imagem[];
  alertas: Alerta[];
  leituras: NdviRecord[];
  telemetria: Telemetry[];
}
export interface ResourceIssue {
  resource: keyof FarmData;
  message: string;
}
export interface DataResult {
  data: FarmData;
  issues: ResourceIssue[];
}
