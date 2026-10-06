import { lazy, Suspense, useState } from "react";
import { useFarmData } from "../../hooks/useFarmData";
import { EmptyState, Field, SectionHeader } from "../ui";
const Plot = lazy(() => import("./NdviPlot"));
export function NdviChart({
  talhao,
  compare = false,
}: {
  talhao?: string;
  compare?: boolean;
}) {
  const { data } = useFarmData();
  const [selected, setSelected] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const code = talhao ?? (selected || data.talhoes[0]?.codigo || "");
  const invalid = !!from && !!to && from > to;
  const records = data.leituras
    .filter(
      (r) =>
        ((compare && !selected) || r.talhao === code) &&
        (!from || r.data.slice(0, 10) >= from) &&
        (!to || r.data.slice(0, 10) <= to),
    )
    .sort((a, b) => a.data.localeCompare(b.data));
  return (
    <section className="panel chart-panel">
      <SectionHeader
        title="Evolução do NDVI"
        description="Atividade vegetativa ao longo das capturas"
      />
      <div className="chart-filters">
        {!talhao ? (
          <Field label="Talhão">
            <select
              value={selected || (!compare ? code : "")}
              onChange={(e) => setSelected(e.target.value)}
            >
              {compare ? <option value="">Comparar todos</option> : null}
              {data.talhoes.map((t) => (
                <option key={t.codigo} value={t.codigo}>
                  {t.codigo}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
        <Field label="De">
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
          />
        </Field>
        <Field label="Até">
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
          />
        </Field>
        <span
          className="info-tip"
          tabIndex={0}
          title="O NDVI varia de −1 a 1. Faixas de referência são ilustrativas e não substituem avaliação agronômica."
          aria-label="NDVI de −1 a 1. Faixas de referência ilustrativas, sem diagnóstico agronômico."
        >
          Sobre o índice ⓘ
        </span>
      </div>
      {invalid ? (
        <EmptyState
          title="Revise o período"
          description="A data inicial deve ser anterior à data final."
        />
      ) : records.length ? (
        <Suspense
          fallback={
            <div
              className="skeleton chart-skeleton"
              role="status"
              aria-label="Carregando gráfico"
            />
          }
        >
          <Plot records={records} />
        </Suspense>
      ) : (
        <EmptyState
          title="Sem leituras neste período"
          description="Selecione outro intervalo ou aguarde uma leitura NDVI."
        />
      )}
      <div className="chart-footnote">
        Faixas de referência: ≥ 0,70 saudável · ≥ 0,50 atenção · ≥ 0,40 risco ·
        abaixo de 0,40 crítico.
      </div>
    </section>
  );
}
