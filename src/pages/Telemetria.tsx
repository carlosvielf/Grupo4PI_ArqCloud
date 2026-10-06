import { lazy, Suspense } from "react";
import { useFarmData } from "../hooks/useFarmData";
import { date, latestMachines, number } from "../lib/format";
import {
  DataBoundary,
  EmptyState,
  Field,
  PageHeader,
  SectionHeader,
  useFilters,
} from "../components/ui";
const Plot = lazy(() => import("../components/charts/TelemetryPlot"));
const metrics = {
  velocidade: { label: "Velocidade", unit: "km/h" },
  combustivel: { label: "Combustível", unit: "%" },
  rpm: { label: "Motor", unit: "RPM" },
  temperatura: { label: "Temperatura", unit: "°C" },
};
type Metric = keyof typeof metrics;
export default function Telemetria() {
  const { data } = useFarmData();
  const f = useFilters();
  const machines = latestMachines(data);
  const machine = f.get("maquina", machines[0]?.maquina ?? "");
  const invalid =
    !!f.get("from") && !!f.get("to") && f.get("from") > f.get("to");
  const records = data.telemetria
    .filter(
      (t) =>
        t.maquina === machine &&
        (!f.get("from") || t.data.slice(0, 10) >= f.get("from")) &&
        (!f.get("to") || t.data.slice(0, 10) <= f.get("to")),
    )
    .sort((a, b) => a.data.localeCompare(b.data));
  const available = (Object.keys(metrics) as Metric[]).filter((key) =>
    records.some((r) => r[key] !== undefined),
  );
  const chosen = f.get("metric");
  const metric = available.includes(chosen as Metric)
    ? (chosen as Metric)
    : available[0];
  return (
    <DataBoundary resources={["telemetria"]}>
      <PageHeader
        title="Telemetria"
        description="Histórico operacional, com as métricas fornecidas por cada equipamento."
      />
      <div className="filter-bar">
        <Field label="Máquina">
          <select
            value={machine}
            onChange={(e) => f.set("maquina", e.target.value)}
          >
            {!machines.length ? (
              <option value="">Sem equipamentos</option>
            ) : null}
            {machines.map((m) => (
              <option key={m.maquina} value={m.maquina}>
                {m.nome ?? m.maquina}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Métrica">
          <select
            value={metric ?? ""}
            onChange={(e) => f.set("metric", e.target.value)}
          >
            {!available.length ? <option value="">Sem métricas</option> : null}
            {available.map((m) => (
              <option key={m} value={m}>
                {metrics[m].label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="De">
          <input
            type="date"
            value={f.get("from")}
            onChange={(e) => f.set("from", e.target.value)}
            max={f.get("to") || undefined}
          />
        </Field>
        <Field label="Até">
          <input
            type="date"
            value={f.get("to")}
            onChange={(e) => f.set("to", e.target.value)}
            min={f.get("from") || undefined}
          />
        </Field>
      </div>
      {invalid ? (
        <EmptyState
          title="Revise o período"
          description="A data inicial deve ser anterior à data final."
        />
      ) : !metric || !records.length ? (
        <EmptyState
          title="Sem telemetria neste período"
          description="Ajuste a seleção ou aguarde novos registros do equipamento."
        />
      ) : (
        <>
          <section className="panel">
            <SectionHeader
              title={`${metrics[metric].label} · ${metrics[metric].unit}`}
              description={`${records.length} registros no período selecionado`}
            />
            {records.filter((r) => r[metric] !== undefined).length >= 2 ? (
              <Suspense fallback={<div className="skeleton chart-skeleton" />}>
                <Plot
                  records={records}
                  metric={metric}
                  unit={metrics[metric].unit}
                />
              </Suspense>
            ) : (
              <EmptyState
                title="Histórico insuficiente para um gráfico"
                description="A leitura disponível pode ser consultada abaixo."
              />
            )}
          </section>
          <section className="panel">
            <SectionHeader title="Leituras registradas" />
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    {available.map((m) => (
                      <th key={m}>
                        {metrics[m].label} ({metrics[m].unit})
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records
                    .slice(-50)
                    .reverse()
                    .map((r, i) => (
                      <tr key={`${r.data}-${i}`}>
                        <td>
                          {date(r.data)} ·{" "}
                          {new Intl.DateTimeFormat("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "America/Sao_Paulo",
                          }).format(new Date(r.data))}
                        </td>
                        {available.map((m) => (
                          <td key={m}>{number(r[m])}</td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {records.length > 50 ? (
              <p className="muted">
                Mostrando os 50 registros mais recentes do período.
              </p>
            ) : null}
          </section>
        </>
      )}
    </DataBoundary>
  );
}
