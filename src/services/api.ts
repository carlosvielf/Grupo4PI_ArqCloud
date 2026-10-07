import type { DataResult, FarmData, ResourceIssue } from "../types";
import { adapters } from "./adapters";
export const isDemo = import.meta.env.VITE_DATA_SOURCE === "demo";
export const endpointConfig = {
  talhoes: import.meta.env.VITE_API_TALHOES_PATH || "/api/talhoes",
  imagens: import.meta.env.VITE_API_IMAGENS_PATH || "/api/imagens",
  alertas: import.meta.env.VITE_API_ALERTAS_PATH || "/api/alertas",
  leituras: import.meta.env.VITE_API_LEITURAS_PATH || "/api/leituras",
  telemetria: import.meta.env.VITE_API_TELEMETRIA_PATH || "/api/telemetria",
};
const empty: FarmData = {
  talhoes: [],
  imagens: [],
  alertas: [],
  leituras: [],
  telemetria: [],
};
async function request(path: string, signal: AbortSignal): Promise<unknown> {
  const base = import.meta.env.VITE_API_BASE_URL || window.location.origin;
  const url = new URL(path, base.endsWith("/") ? base : `${base}/`);
  const response = await fetch(url, {
    signal,
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!response.ok)
    throw new Error(
      response.status === 401 || response.status === 403
        ? "Acesso não autorizado. Verifique sua sessão."
        : `Não foi possível carregar os dados (HTTP ${response.status}).`,
    );
  return response.json();
}
export async function loadFarmData(signal: AbortSignal): Promise<DataResult> {
  if (isDemo) {
    const { demoData } = await import("../mocks/data");
    return { data: demoData, issues: [] };
  }
  const timeout = AbortSignal.timeout(15000);
  const combined = AbortSignal.any([signal, timeout]);
  const data: FarmData = { ...empty };
  const issues: ResourceIssue[] = [];
  await Promise.all(
    (Object.keys(endpointConfig) as (keyof FarmData)[]).map(
      async (resource) => {
        const path = endpointConfig[resource];
        if (!path) {
          issues.push({ resource, message: "Fonte de dados não configurada." });
          return;
        }
        try {
          const value = await request(path, combined);
          Object.assign(data, { [resource]: adapters[resource](value) });
        } catch (error) {
          if (signal.aborted) throw error;
          issues.push({
            resource,
            message: timeout.aborted
              ? "A consulta excedeu 15 segundos. Tente atualizar."
              : error instanceof Error
                ? error.message
                : "Falha ao carregar. Tente atualizar.",
          });
        }
      },
    ),
  );
  return { data, issues };
}
